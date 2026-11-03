<?php
/**
 * The Mad Story — Dynamic Open Graph & Twitter Card Preview
 * Serves dynamic meta tags (blog thumbnail and blog title) to social media crawlers
 * (Facebook, WhatsApp, Twitter/X, LinkedIn, Telegram, Discord, etc.) when sharing blog detail page links.
 */

// 1. Extract requested article slug from query string or request URI
$slug = $_GET['slug'] ?? '';
if (empty($slug)) {
    $requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (preg_match('#^/post/([^/]+)#', $requestUri, $matches)) {
        $slug = $matches[1];
    }
}

if (empty($slug)) {
    header('Location: /', true, 302);
    exit;
}

$slug = trim(rawurldecode($slug));
$canonicalUrl = 'https://themadstory.com/post/' . rawurlencode($slug);

// 2. Default fallback values
$siteName = 'The Mad Story';
$title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
$articleTitle = 'The Mad Story';
$description = 'The Mad Story is a premier cultural and lifestyle magazine exploring design, architecture, literature, cinema, and contemporary editorial narratives.';
$imageUrl = 'https://themadstory.com/assets/images/Madstory-logo.png';
$author = 'The Mad Story Editorial Desk';
$publishedTime = '';

// 3. Query Django backend metadata endpoint
$apiUrl = 'https://api.themadstory.com/api/v1/posts/' . rawurlencode($slug) . '/meta/';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => "Accept: application/json\r\nUser-Agent: MadStory-PreviewProxy/1.0\r\n",
        'timeout' => 3.0,
        'ignore_errors' => true
    ]
]);

$response = @file_get_contents($apiUrl, false, $context);
if ($response !== false) {
    $data = @json_decode($response, true);
    if (is_array($data)) {
        if (!empty($data['title'])) {
            $articleTitle = $data['title'];
            $title = $data['title'] . ' — ' . $siteName;
        }
        if (!empty($data['excerpt'])) {
            $description = $data['excerpt'];
        }
        if (!empty($data['image'])) {
            $imageUrl = $data['image'];
        }
        if (!empty($data['author'])) {
            $author = $data['author'];
        }
        if (!empty($data['published_at'])) {
            $publishedTime = $data['published_at'];
        }
    }
}

// 4. Ensure absolute HTTPS URL for the image
if (str_starts_with($imageUrl, '//')) {
    $imageUrl = 'https:' . $imageUrl;
} elseif (str_starts_with($imageUrl, '/')) {
    if (str_starts_with($imageUrl, '/media/')) {
        $imageUrl = 'https://api.themadstory.com' . $imageUrl;
    } else {
        $imageUrl = 'https://themadstory.com' . $imageUrl;
    }
} elseif (str_starts_with($imageUrl, 'http://')) {
    $imageUrl = 'https://' . substr($imageUrl, 7);
}

// 5. Determine image MIME type for og:image:type
$imageMime = 'image/jpeg';
if (preg_match('/\.(png)(\?.*)?$/i', $imageUrl)) {
    $imageMime = 'image/png';
} elseif (preg_match('/\.(webp)(\?.*)?$/i', $imageUrl)) {
    $imageMime = 'image/webp';
} elseif (preg_match('/\.(gif)(\?.*)?$/i', $imageUrl)) {
    $imageMime = 'image/gif';
}

// 6. Escape variables for safe HTML output
$escTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
$escArticleTitle = htmlspecialchars($articleTitle, ENT_QUOTES, 'UTF-8');
$escDesc = htmlspecialchars($description, ENT_QUOTES, 'UTF-8');
$escImg = htmlspecialchars($imageUrl, ENT_QUOTES, 'UTF-8');
$escUrl = htmlspecialchars($canonicalUrl, ENT_QUOTES, 'UTF-8');
$escAuthor = htmlspecialchars($author, ENT_QUOTES, 'UTF-8');
$escSiteName = htmlspecialchars($siteName, ENT_QUOTES, 'UTF-8');

header('Content-Type: text/html; charset=utf-8');
?>
<!doctype html>
<html lang="bn-BD" dir="ltr" prefix="og: https://ogp.me/ns# fb: https://ogp.me/ns/fb# article: https://ogp.me/ns/article#">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?= $escTitle ?></title>

    <!-- Primary OpenGraph Image & Media Tags (Placed at the very top for WhatsApp/Facebook scrapers) -->
    <meta property="og:image" content="<?= $escImg ?>" />
    <meta property="og:image:secure_url" content="<?= $escImg ?>" />
    <meta property="og:image:type" content="<?= $imageMime ?>" />
    <meta property="og:image:alt" content="<?= $escArticleTitle ?>" />
    <link rel="image_src" href="<?= $escImg ?>" />

    <!-- Twitter Card Image Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="<?= $escImg ?>" />
    <meta name="twitter:image:src" content="<?= $escImg ?>" />
    <meta name="twitter:image:alt" content="<?= $escArticleTitle ?>" />

    <!-- Open Graph Content & Article Metadata -->
    <meta property="og:site_name" content="<?= $escSiteName ?>" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="<?= $escUrl ?>" />
    <meta property="og:title" content="<?= $escArticleTitle ?>" />
    <meta property="og:description" content="<?= $escDesc ?>" />
    <meta property="og:locale" content="bn_BD" />
    <meta property="og:locale:alternate" content="en_US" />
    <?php if (!empty($publishedTime)): ?>
    <meta property="article:published_time" content="<?= htmlspecialchars($publishedTime, ENT_QUOTES, 'UTF-8') ?>" />
    <?php endif; ?>
    <meta property="article:author" content="<?= $escAuthor ?>" />

    <!-- Twitter Card Metadata -->
    <meta name="twitter:site" content="@themadstory" />
    <meta name="twitter:url" content="<?= $escUrl ?>" />
    <meta name="twitter:title" content="<?= $escArticleTitle ?>" />
    <meta name="twitter:description" content="<?= $escDesc ?>" />

    <!-- Standard SEO -->
    <meta name="description" content="<?= $escDesc ?>" />
    <meta name="author" content="<?= $escAuthor ?>" />
    <link rel="canonical" href="<?= $escUrl ?>" />

    <!-- JS Redirect for Human Browsers (No meta refresh to ensure crawlers never drop image) -->
    <script>
        if (window.location.href !== "<?= $escUrl ?>") {
            window.location.replace("<?= $escUrl ?>");
        }
    </script>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fcfbfa; color: #1e2022; padding: 40px 20px; text-align: center;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; border: 1px solid #ded7cc; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        <h1 style="font-size: 20px; line-height: 1.4; color: #800020; margin-bottom: 16px;"><?= $escArticleTitle ?></h1>
        <img src="<?= $escImg ?>" alt="<?= $escArticleTitle ?>" style="max-width: 100%; height: auto; border-radius: 6px; margin-bottom: 20px;" />
        <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;"><?= $escDesc ?></p>
        <p style="font-size: 14px; color: #6b7280;">পুনর্নির্দেশ করা হচ্ছে... / Redirecting...</p>
        <a href="<?= $escUrl ?>" style="display: inline-block; background-color: #800020; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 10px;">সম্পূর্ণ লেখাটি পড়ুন / Read Full Article</a>
    </div>
</body>
</html>
