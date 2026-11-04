import os
import mimetypes
import urllib.request
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.apps import apps
import boto3
from botocore.exceptions import ClientError


class Command(BaseCommand):
    help = "Uploads local media files and transfers remote images from the previous shared hosting (api.themadstory.com) to Cloudflare R2."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite files in R2 even if they already exist.'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='List files that would be uploaded without actually uploading.'
        )
        parser.add_argument(
            '--skip-remote',
            action='store_true',
            help='Do not download missing images from api.themadstory.com'
        )

    def handle(self, *args, **options):
        account_id = getattr(settings, 'CLOUDFLARE_R2_ACCOUNT_ID', None) or os.environ.get('CLOUDFLARE_R2_ACCOUNT_ID')
        access_key = getattr(settings, 'CLOUDFLARE_R2_ACCESS_KEY_ID', None) or os.environ.get('CLOUDFLARE_R2_ACCESS_KEY_ID')
        secret_key = getattr(settings, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', None) or os.environ.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
        bucket_name = getattr(settings, 'CLOUDFLARE_R2_BUCKET_NAME', None) or os.environ.get('CLOUDFLARE_R2_BUCKET_NAME')
        endpoint_url = getattr(settings, 'CLOUDFLARE_R2_ENDPOINT_URL', None) or os.environ.get('CLOUDFLARE_R2_ENDPOINT_URL')

        if not endpoint_url:
            if account_id:
                endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
            else:
                self.stderr.write(self.style.ERROR(
                    "Error: Neither CLOUDFLARE_R2_ACCOUNT_ID nor CLOUDFLARE_R2_ENDPOINT_URL is configured."
                ))
                return

        if not access_key or not secret_key or not bucket_name:
            self.stderr.write(self.style.ERROR(
                "Error: Cloudflare R2 credentials missing. Ensure CLOUDFLARE_R2_ACCESS_KEY_ID, "
                "CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME are set."
            ))
            return

        media_root = Path(settings.MEDIA_ROOT)
        media_root.mkdir(parents=True, exist_ok=True)

        self.stdout.write(self.style.NOTICE(f"Connecting to Cloudflare R2 bucket: {bucket_name}"))
        self.stdout.write(f"Endpoint: {endpoint_url}")

        s3_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name='auto'
        )

        force = options['force']
        dry_run = options['dry_run']
        skip_remote = options['skip_remote']

        # Step 1: Scan database for any images hosted on api.themadstory.com and ensure they are downloaded locally
        if not skip_remote:
            self.stdout.write(self.style.NOTICE("\n[Phase 1] Scanning database for images hosted on previous shared host (api.themadstory.com)..."))
            remote_urls = set()
            for model in apps.get_app_config('core').get_models():
                for obj in model.objects.all():
                    for field in obj._meta.fields:
                        val = getattr(obj, field.name, None)
                        if isinstance(val, str) and 'api.themadstory.com/media/' in val:
                            idx = val.find('api.themadstory.com/media/')
                            rel = val[idx + len('api.themadstory.com/media/'):]
                            remote_urls.add(rel)

            self.stdout.write(f"Found {len(remote_urls)} image references pointing to previous host.")
            for rel_path in sorted(list(remote_urls)):
                local_path = media_root / rel_path
                if not local_path.exists() or local_path.stat().st_size == 0:
                    local_path.parent.mkdir(parents=True, exist_ok=True)
                    src_url = f"https://api.themadstory.com/media/{rel_path}"
                    try:
                        req = urllib.request.Request(src_url, headers={'User-Agent': 'Mozilla/5.0'})
                        with urllib.request.urlopen(req, timeout=10) as res:
                            with open(local_path, 'wb') as f:
                                f.write(res.read())
                        self.stdout.write(self.style.SUCCESS(f"  [v] Downloaded from previous host: {rel_path}"))
                    except Exception as e:
                        self.stderr.write(self.style.WARNING(f"  [!] Could not fetch {src_url}: {e}"))

        # Step 2: Upload all files in media_root to R2
        self.stdout.write(self.style.NOTICE("\n[Phase 2] Uploading media files to Cloudflare R2..."))
        total_files = 0
        uploaded_files = 0
        skipped_files = 0

        for root, _, files in os.walk(media_root):
            for file in files:
                total_files += 1
                local_path = Path(root) / file
                r2_key = str(local_path.relative_to(media_root)).replace('\\', '/')

                content_type, _ = mimetypes.guess_type(str(local_path))
                if not content_type:
                    content_type = 'application/octet-stream'

                if not force:
                    try:
                        s3_client.head_object(Bucket=bucket_name, Key=r2_key)
                        self.stdout.write(f"  [-] Skipped (already in R2): {r2_key}")
                        skipped_files += 1
                        continue
                    except ClientError as e:
                        error_code = e.response.get('Error', {}).get('Code')
                        if error_code not in ('404', 'NoSuchKey', 'NotFound'):
                            self.stderr.write(self.style.WARNING(f"  [!] Warning checking {r2_key}: {e}"))

                if dry_run:
                    self.stdout.write(f"  [Dry Run] Would upload: {r2_key} ({local_path.stat().st_size} bytes, {content_type})")
                    uploaded_files += 1
                    continue

                try:
                    self.stdout.write(f"  [+] Uploading {r2_key} ({local_path.stat().st_size} bytes) ...")
                    with open(local_path, 'rb') as f:
                        s3_client.put_object(
                            Bucket=bucket_name,
                            Key=r2_key,
                            Body=f,
                            ContentType=content_type
                        )
                    uploaded_files += 1
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"  [x] Failed to upload {r2_key}: {e}"))

        self.stdout.write(self.style.SUCCESS(
            f"\nSync Complete! Total local files: {total_files} | Uploaded to R2: {uploaded_files} | Skipped: {skipped_files}"
        ))
