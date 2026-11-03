"""
Bengali to English (Roman / Latin script) phonetic transliteration engine.
Ensures URLs and slugs are 100% clean ASCII without URL percent-encoding (%).
"""
import re
import unicodedata

# Common dictionary words / loan words frequently seen in articles and titles
COMMON_WORDS = {
    'দ্য': 'the',
    'স্টোরি': 'story',
    'রুম': 'room',
    'এআই': 'ai',
    'ওয়াং': 'wang',
    'স্কেল': 'scale',
    'অনলাইন': 'online',
    'মিডিয়া': 'media',
    'মিডিয়া': 'media',
    'সিনেমা': 'cinema',
    'ফিল্ম': 'film',
    'আর্ট': 'art',
    'কালচার': 'culture',
    'ডিজাইন': 'design',
    'লাইফস্টাইল': 'lifestyle',
    'টেক': 'tech',
    'নিউজ': 'news',
    'বাংলাদেশ': 'bangladesh',
    'ঢাকা': 'dhaka',
    'কলকাতা': 'kolkata',
    'সাহিত্য': 'sahitya',
    'শিল্প': 'shilpa',
    'সংস্কৃতি': 'songskriti',
    'নাটক': 'natok',
    'গান': 'gan',
    'কবিতা': 'kobita',
    'বই': 'boi',
    'চলচ্চিত্র': 'cholochitro',
    'বিল্বমঙ্গল': 'bilwamangal',
    'প্ল্যাটফর্ম': 'platform',
    'পল্যাাটফর্ম': 'platform',
    'প্রেমতত্ত্ব': 'premototto',
    'মডেল': 'model',
    'ফ্যাশন': 'fashion',
    'ফটোগ্রাফি': 'photography',
    'ইন্টারভিউ': 'interview',
    'আর্টিকেল': 'article',
    'রিভিউ': 'review',
    'ট্রাভেল': 'travel',
    'ফুড': 'food',
}

INDEPENDENT_VOWELS = {
    '\u0985': 'o',    # অ
    '\u0986': 'a',    # আ
    '\u0987': 'i',    # ই
    '\u0988': 'i',    # ঈ
    '\u0989': 'u',    # উ
    '\u098A': 'u',    # ঊ
    '\u098B': 'ri',   # ঋ
    '\u098F': 'e',    # এ
    '\u0990': 'oi',   # ঐ
    '\u0993': 'o',    # ও
    '\u0994': 'ou',   # ঔ
}

VOWEL_SIGNS = {
    '\u09BE': 'a',    # া
    '\u09BF': 'i',    # ি
    '\u09C0': 'i',    # ী
    '\u09C1': 'u',    # ু
    '\u09C2': 'u',    # ূ
    '\u09C3': 'ri',   # ৃ
    '\u09C4': 'ri',   # ৄ
    '\u09C7': 'e',    # ে
    '\u09C8': 'oi',   # ৈ
    '\u09CB': 'o',    # ো
    '\u09CC': 'ou',   # ৌ
}

CONSONANTS = {
    '\u0995': 'k',    # ক
    '\u0996': 'kh',   # খ
    '\u0997': 'g',    # গ
    '\u0998': 'gh',   # ঘ
    '\u0999': 'ng',   # ঙ
    '\u099A': 'ch',   # চ
    '\u099B': 'chh',  # ছ
    '\u099C': 'j',    # জ
    '\u099D': 'jh',   # ঝ
    '\u099E': 'n',    # ঞ
    '\u099F': 't',    # ট
    '\u09A0': 'th',   # ঠ
    '\u09A1': 'd',    # ড
    '\u09A2': 'dh',   # ঢ
    '\u09A3': 'n',    # ণ
    '\u09A4': 't',    # ত
    '\u09A5': 'th',   # থ
    '\u09A6': 'd',    # দ
    '\u09A7': 'dh',   # ধ
    '\u09A8': 'n',    # ন
    '\u09AA': 'p',    # প
    '\u09AB': 'f',    # ফ
    '\u09AC': 'b',    # ব
    '\u09AD': 'bh',   # ভ
    '\u09AE': 'm',    # ম
    '\u09AF': 'j',    # য
    '\u09B0': 'r',    # র
    '\u09B2': 'l',    # ল
    '\u09B6': 'sh',   # শ
    '\u09B7': 'sh',   # ষ
    '\u09B8': 's',    # স
    '\u09B9': 'h',    # হ
    '\u09DC': 'r',    # ড়
    '\u09DD': 'rh',   # ঢ়
    '\u09DF': 'y',    # য়
    '\u09CE': 't',    # ৎ
    '\u0982': 'ng',   # ং
    '\u0983': 'h',    # ঃ
    '\u0981': '',     # ঁ
}

DIGITS = {
    '\u09E6': '0', '\u09E7': '1', '\u09E8': '2', '\u09E9': '3', '\u09EA': '4',
    '\u09EB': '5', '\u09EC': '6', '\u09ED': '7', '\u09EE': '8', '\u09EF': '9',
}

VIRAMA = '\u09CD'   # ্


def transliterate_word(word: str) -> str:
    """
    Transliterates a single Bengali word or token to natural English/Roman characters.
    """
    if not word:
        return ''
        
    cleaned = word.strip()
    if cleaned in COMMON_WORDS:
        return COMMON_WORDS[cleaned]

    # If it is already pure ASCII, return as is
    if all(ord(c) < 128 for c in cleaned):
        return cleaned

    chars = list(cleaned)
    n = len(chars)
    out = []
    i = 0

    while i < n:
        c = chars[i]

        # 1. Digits
        if c in DIGITS:
            out.append(DIGITS[c])
            i += 1
            continue

        # 2. Independent Vowels
        if c in INDEPENDENT_VOWELS:
            # Word-initial 'অ' -> often 'a' before 'ন', 'ম', 'ল', 'র', 'শ', 'ষ', 'স', 'ভ'
            if c == '\u0985' and i == 0 and n > 1 and chars[1] in ('\u09A8', '\u09AE', '\u09B2', '\u09B0', '\u09B6', '\u09B7', '\u09B8', '\u09AD'):
                out.append('a')
            else:
                out.append(INDEPENDENT_VOWELS[c])
            i += 1
            continue

        # 3. Consonants
        if c in CONSONANTS:
            base = CONSONANTS[c]
            next_c = chars[i + 1] if i + 1 < n else None
            next_next_c = chars[i + 2] if i + 2 < n else None

            # Check conjunct with virama (্)
            if next_c == VIRAMA:
                if next_next_c and next_next_c in CONSONANTS:
                    # Special conjunct phonetics
                    if c == '\u0995' and next_next_c == '\u09B7':     # ক্ষ -> ksh
                        conj = 'ksh'
                    elif c == '\u099C' and next_next_c == '\u099E':   # জ্ঞ -> gy
                        conj = 'gy'
                    elif next_next_c == '\u09AF':                     # ্য -> y
                        conj = base + 'y'
                    elif next_next_c == '\u09B0':                     # ্র -> r
                        conj = base + 'r'
                    elif next_next_c == '\u09AC':                     # ্ব -> b or single
                        conj = base if base in ('s', 'sh') else base + 'b'
                    else:
                        conj = base + CONSONANTS[next_next_c]

                    # Check if followed by vowel sign (i+3)
                    next_3 = chars[i + 3] if i + 3 < n else None
                    if next_3 and next_3 in VOWEL_SIGNS:
                        out.append(conj + VOWEL_SIGNS[next_3])
                        i += 4
                    else:
                        out.append(conj)
                        i += 3
                    continue
                else:
                    out.append(base)
                    i += 2
                    continue
            elif next_c in VOWEL_SIGNS:
                out.append(base + VOWEL_SIGNS[next_c])
                i += 2
                continue
            else:
                # Inherent vowel rule:
                # add 'o' if followed by consonant and not at the end
                if next_c and next_c in CONSONANTS and (i + 2 < n and chars[i + 1] != VIRAMA):
                    out.append(base + 'o')
                else:
                    out.append(base)
                i += 1
                continue

        # 4. Standard ASCII alphanumeric
        if ord(c) < 128 and (c.isalnum() or c == '-'):
            out.append(c)

        i += 1

    return ''.join(out)


def transliterate_to_english_slug(text: str, max_words: int = 7, max_chars: int = 75) -> str:
    """
    Converts any text (Bengali, English, or mixed) into a 100% clean English/ASCII slug.
    Guarantees no non-ASCII characters, so URLs never produce % percent-encoding.
    """
    if not text:
        return ''

    text = unicodedata.normalize('NFC', str(text).strip())
    # Replace non-alphanumeric and non-bengali with whitespace
    text = re.sub(r'[^\w\s\-\u0980-\u09FF]', ' ', text)
    words = [w for w in text.split() if w]

    if max_words:
        words = words[:max_words]

    trans_words = [transliterate_word(w) for w in words]
    res = '-'.join([w for w in trans_words if w]).lower()
    
    # Strictly enforce 100% ASCII (a-z, 0-9, -)
    res = re.sub(r'[^a-z0-9\-]', '', res)
    res = re.sub(r'-+', '-', res).strip('-')

    if max_chars and len(res) > max_chars:
        res = res[:max_chars].rstrip('-')
        last_dash = res.rfind('-')
        if last_dash > 15:
            res = res[:last_dash]

    return res
