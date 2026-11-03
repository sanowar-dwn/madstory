from django.core.management.base import BaseCommand
from core.models import Article, Category, generate_clean_slug, make_unique_slug


class Command(BaseCommand):
    help = 'Transliterates all non-English / Bengali slugs to clean English ASCII slugs'

    def handle(self, *args, **options):
        self.stdout.write("Checking categories...")
        cat_count = 0
        for cat in Category.objects.all():
            if not all(ord(c) < 128 for c in cat.slug):
                old_slug = cat.slug
                source_name = cat.name_en.strip() if (cat.name_en and cat.name_en.strip()) else cat.name
                base = generate_clean_slug(source_name, max_words=6, max_chars=60)
                cat.slug = make_unique_slug(Category, base, cat.id, fallback_prefix='category')
                cat.save()
                cat_count += 1
                self.stdout.write(f"Updated category [{cat.id}]: {old_slug} -> {cat.slug}")

        self.stdout.write(f"Updated {cat_count} categories.\n")

        self.stdout.write("Checking articles...")
        art_count = 0
        for art in Article.objects.all():
            if not all(ord(c) < 128 for c in art.slug):
                old_slug = art.slug
                source_title = art.title_en.strip() if (art.title_en and art.title_en.strip()) else art.title
                base = generate_clean_slug(source_title, max_words=7, max_chars=75)
                art.slug = make_unique_slug(Article, base, art.id, fallback_prefix='post')
                art.save()
                art_count += 1
                self.stdout.write(f"Updated article [{art.id}]: {art.slug}")

        self.stdout.write(self.style.SUCCESS(f"Successfully converted {art_count} articles and {cat_count} categories to 100% English ASCII slugs!"))
