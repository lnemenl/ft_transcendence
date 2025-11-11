export function LanguageSelect() {
    const lang = function (event) {
        let locale = event.target.value;
        document.documentElement.lang = locale;
        window.localStorage.setItem('ft_transcendence:lang', locale);
        window.dispatchEvent(new Event("languageChange"));
    };
    let locale = window.localStorage.getItem('ft_transcendence:lang');
    return (
        <div className="fixed top-20 right-6 z-50">
            <select
                defaultValue={locale}
                onChange={lang}
                className="grid place-items-center h-11 w-9 hover:scale-150 transition text-xl cursor-pointer appearance-none border-none focus:outline-none"
            >
                <option value="en">🇬🇧</option>
                <option value="fi">🇫🇮</option>
                <option value="fr">🇫🇷</option>
                <option value="ru">🇷🇺</option>
            </select>
        </div>
    );
}
