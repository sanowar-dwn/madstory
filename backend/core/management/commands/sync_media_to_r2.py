import os
import mimetypes
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
import boto3
from botocore.exceptions import ClientError


class Command(BaseCommand):
    help = "Uploads existing local media files (backend/media/) to Cloudflare R2 object storage."

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
        if not media_root.exists():
            self.stderr.write(self.style.WARNING(f"Media directory does not exist: {media_root}"))
            return

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

        total_files = 0
        uploaded_files = 0
        skipped_files = 0

        # Traverse MEDIA_ROOT
        for root, _, files in os.walk(media_root):
            for file in files:
                total_files += 1
                local_path = Path(root) / file
                # R2 object key relative to media root, normalized with forward slashes
                r2_key = str(local_path.relative_to(media_root)).replace('\\', '/')

                content_type, _ = mimetypes.guess_type(str(local_path))
                if not content_type:
                    content_type = 'application/octet-stream'

                # Check if file exists in R2
                if not force:
                    try:
                        s3_client.head_object(Bucket=bucket_name, Key=r2_key)
                        self.stdout.write(self.style.NOTICE(f"[-] Skipped (already exists): {r2_key}"))
                        skipped_files += 1
                        continue
                    except ClientError as e:
                        # 404 Not Found means the object does not exist yet
                        error_code = e.response.get('Error', {}).get('Code')
                        if error_code not in ('404', 'NoSuchKey', 'NotFound'):
                            self.stderr.write(self.style.WARNING(f"[!] Warning checking {r2_key}: {e}"))

                if dry_run:
                    self.stdout.write(f"[Dry Run] Would upload: {r2_key} ({local_path.stat().st_size} bytes, {content_type})")
                    uploaded_files += 1
                    continue

                try:
                    self.stdout.write(f"[+] Uploading {r2_key} ...")
                    with open(local_path, 'rb') as f:
                        s3_client.put_object(
                            Bucket=bucket_name,
                            Key=r2_key,
                            Body=f,
                            ContentType=content_type
                        )
                    uploaded_files += 1
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"[x] Failed to upload {r2_key}: {e}"))

        self.stdout.write(self.style.SUCCESS(
            f"\nSync Complete! Total scanned: {total_files} | Uploaded: {uploaded_files} | Skipped: {skipped_files}"
        ))
