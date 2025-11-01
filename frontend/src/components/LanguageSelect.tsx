export function LanguageSelect() {
    const lang = function (event) {
        let languageCode = event.target.value;
        document.documentElement.lang = languageCode;
    };
    return (
        <div className="fixed top-20 right-6 z-50">
            <select
                onChange={lang}
                className="grid place-items-center h-11 w-9 hover:scale-150 transition text-xl cursor-pointer appearance-none border-none focus:outline-none"
            >
                <option value="en">🇬🇧</option>
                <option value="fr">🇫🇷</option>
                <option value="fi">🇫🇮</option>
                <option value="ru">🇷🇺</option>
            </select>
        </div>
    );
}
