export function LanguageSelect() {
    const lang = function (event) {
        let languageCode = event.target.value;
        document.documentElement.lang = languageCode;
    };
    return (
        <select onChange={lang} className="fixed top-20 right-6 z-50">
            <option value="en">EN</option>
            <option value="fr">FR</option>
        </select>
    );
}
