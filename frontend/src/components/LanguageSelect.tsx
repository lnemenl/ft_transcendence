export function LanguageSelect() {
    const lang = function (event: React.ChangeEvent<HTMLSelectElement>) {
        let locale = event.target.value;
        document.documentElement.lang = locale;
        window.localStorage.setItem('ft_transcendence:lang', locale);
        window.dispatchEvent(new Event("languageChange"));
    };
    const storedLocale = window.localStorage.getItem('ft_transcendence:lang');
    const locale = storedLocale ?? "en";
    return (
        <div className="">
            <select
                defaultValue={locale}
                onChange={lang}
                className="appearance-none hover:scale-110 border-none focus:outline-none">
                <option value="en">🇬🇧 ENG</option>
                <option value="fi">🇫🇮 FIN</option>
                <option value="fr">🇫🇷 FRA</option>
                <option value="ru">🇷🇺 RUS</option>
            </select>
        </div>
    );
}