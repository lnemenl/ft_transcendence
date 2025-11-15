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
      <select 
        defaultValue={locale}
        onChange={lang}
        className="w-full bg-transparent text-white text-base cursor-pointer border-none focus:outline-none appearance-none p-1">
        <option value="en">🇬🇧 ENG</option>
        <option value="fi">🇫🇮 FIN</option>
        <option value="fr">🇫🇷 FRA</option>
        <option value="ru">🇷🇺 RUS</option>
      </select>
    );
}