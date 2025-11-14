export function LanguageSelect() {
    const lang = function (event) {
        let locale = event.target.value;
        document.documentElement.lang = locale;
        window.localStorage.setItem('ft_transcendence:lang', locale);
        window.dispatchEvent(new Event("languageChange"));
    };
    let locale = window.localStorage.getItem('ft_transcendence:lang');
    return (
        <div className="">
            <select
                defaultValue={locale}
                onChange={lang}
                className="appearance-none text-xl hover:scale-150 border-none focus:outline-none">
                <option value="en">🇬🇧</option>
                <option value="fi">🇫🇮</option>
                <option value="fr">🇫🇷</option>
                <option value="ru">🇷🇺</option>
            </select>
        </div>
    );
}