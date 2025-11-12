import { useState, useEffect } from "react";

export const useLanguage = (): void => {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const handleLanguageChange = () => forceUpdate({});
        window.addEventListener('languageChange', handleLanguageChange);
        return () => window.removeEventListener('languageChange', handleLanguageChange);
    }, []);
};
