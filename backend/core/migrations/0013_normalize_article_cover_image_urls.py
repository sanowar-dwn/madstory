from django.db import migrations


def normalize_cover_image_urls(apps, schema_editor):
    Article = apps.get_model('core', 'Article')
    r2_base = 'https://pub-e30dac90a68b4fcd967e225c8fac5144.r2.dev/'

    # Specific fixes for missing legacy cPanel images
    specific_fixes = {
        27: f'{r2_base}uploads/2026/10/81a05130fb_18fa90459b0221205642787d05abb5a2.jpg',
        35: f'{r2_base}uploads/2026/10/bf03f93bd2_818563600_4061751080786123_11247613.jpg',
        37: f'{r2_base}uploads/2026/11/f3e3c23d25_-1x-1.webp',
    }

    for art in Article.objects.all():
        updated = False
        if art.id in specific_fixes:
            art.cover_image_url = specific_fixes[art.id]
            updated = True
        elif art.cover_image_url:
            url = art.cover_image_url
            for old_prefix in (
                'https://api.themadstory.com/media/',
                'http://api.themadstory.com/media/',
                '//api.themadstory.com/media/',
            ):
                if url.startswith(old_prefix):
                    rel = url[len(old_prefix):]
                    art.cover_image_url = f"{r2_base}{rel}"
                    updated = True
                    break

            if not updated and url.startswith('/media/'):
                rel = url[len('/media/'):]
                art.cover_image_url = f"{r2_base}{rel}"
                updated = True

            if not updated and url.startswith('/assets/images/'):
                rel = url[len('/assets/images/'):]
                art.cover_image_url = f"{r2_base}assets/images/{rel}"
                updated = True

        if updated:
            art.save(update_fields=['cover_image_url'])

    # Also normalize AuthorProfile image fields
    AuthorProfile = apps.get_model('core', 'AuthorProfile')
    for prof in AuthorProfile.objects.all():
        prof_updated = False
        for field in ('avatar', 'cover_image'):
            val = getattr(prof, field, '') or ''
            for old_prefix in (
                'https://api.themadstory.com/media/',
                'http://api.themadstory.com/media/',
                '//api.themadstory.com/media/',
            ):
                if val.startswith(old_prefix):
                    rel = val[len(old_prefix):]
                    setattr(prof, field, f"{r2_base}{rel}")
                    prof_updated = True
                    break
        if prof_updated:
            prof.save()


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_video_category'),
    ]

    operations = [
        migrations.RunPython(normalize_cover_image_urls, reverse_noop),
    ]
