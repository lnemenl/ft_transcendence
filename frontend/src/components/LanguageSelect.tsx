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
        className="w-full bg-transparent text-white cursor-pointer border-none focus:outline-none appearance-none p-1"
        style={{ colorScheme: 'dark' }}
      >
        <option value="en" className="bg-[#24273a] text-white">🇬🇧 ENG</option>
        <option value="fi" className="bg-[#24273a] text-white">🇫🇮 FIN</option>
        <option value="fr" className="bg-[#24273a] text-white">🇫🇷 FRA</option>
        <option value="ru" className="bg-[#24273a] text-white">🇷🇺 RUS</option>
      </select>
    );
}
