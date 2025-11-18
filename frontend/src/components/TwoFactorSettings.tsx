import { useState, useEffect } from "react";
import { useLanguage } from "./useLanguage";

type TwoFactorSettingsProps = {
  onClose?: () => void;
};

export function TwoFactorSettings({ onClose }: TwoFactorSettingsProps) {
  const t = useLanguage();
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // For enabling 2FA
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  // For disabling 2FA
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setIsTwoFactorEnabled(data.isTwoFactorEnabled || false);
      } else {
        console.error("Failed to load profile, status:", res.status);
        setError(t.failedToLoadProfile);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(t.couldNotConnectToServer);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateQR = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/2fa/generate", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setQrCode(data.qrCodeDataUrl);
        setSecret(data.secret);
        setShowQRCode(true);
      } else {
        const errorData = await res.json();
        setError(errorData.error || t.failedToLoadProfile);
      }
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError(t.couldNotConnectToServer);
    }
  };

  const handleEnableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ SixDigitCode: verificationCode }),
      });

      if (res.ok) {
        setSuccess(t.twoFactorEnabledSuccess);
        setIsTwoFactorEnabled(true);
        setShowQRCode(false);
        setVerificationCode("");
        setQrCode("");
        setSecret("");
      } else {
        const errorData = await res.json();
        setError(errorData.error || t.invalidCode);
      }
    } catch (err) {
      console.error("Error enabling 2FA:", err);
      setError(t.couldNotConnectToServer);
    }
  };

  const handleDisableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ SixDigitCode: disableCode }),
      });

      if (res.ok) {
        setSuccess(t.twoFactorDisabledSuccess);
        setIsTwoFactorEnabled(false);
        setShowDisableForm(false);
        setDisableCode("");
      } else {
        const errorData = await res.json();
        setError(errorData.error || t.invalidCode);
      }
    } catch (err) {
      console.error("Error disabling 2FA:", err);
      setError(t.couldNotConnectToServer);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <p className="text-center text-gray-500 dark:text-gray-400">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Status */}
      <div className="mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t.status}: <span className={`font-semibold ${isTwoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {isTwoFactorEnabled ? t.twoFactorEnabled : t.twoFactorDisabled}
          </span>
        </p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
        </div>
      )}

      {/* Enable 2FA Flow */}
      {!isTwoFactorEnabled && !showQRCode && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t.twoFactorExplanation}
          </p>
          <button
            onClick={handleGenerateQR}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 text-white text-sm font-medium w-full transition-colors"
          >
            {t.enableTwoFactor}
          </button>
        </div>
      )}

      {/* Show QR Code and Verification */}
      {!isTwoFactorEnabled && showQRCode && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t.scanQRCode}
          </p>

          <div className="flex justify-center mb-4">
            <img src={qrCode} alt="QR Code" className="border-2 border-gray-300 dark:border-gray-600 rounded-lg" />
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {t.manualEntry}
            </p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs break-all text-gray-900 dark:text-gray-200">
              {secret}
            </code>
          </div>

          <form onSubmit={handleEnableTwoFactor}>
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              {t.enterSixDigitCode}
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#24273a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              placeholder="000000"
              maxLength={6}
              pattern="\d{6}"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 text-white text-sm font-medium flex-1 transition-colors"
              >
                {t.verifyAndEnable}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQRCode(false);
                  setQrCode("");
                  setSecret("");
                  setVerificationCode("");
                }}
                className="bg-gray-500 hover:bg-gray-600 rounded-lg px-4 py-2 text-white text-sm font-medium transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disable 2FA Flow */}
      {isTwoFactorEnabled && !showDisableForm && (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t.twoFactorProtected}
          </p>
          <button
            onClick={() => setShowDisableForm(true)}
            className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 text-white text-sm font-medium w-full transition-colors"
          >
            {t.disableTwoFactor}
          </button>
        </div>
      )}

      {isTwoFactorEnabled && showDisableForm && (
        <form onSubmit={handleDisableTwoFactor}>
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
            {t.enterSixDigitCode}
          </label>
          <input
            type="text"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#24273a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            placeholder="000000"
            maxLength={6}
            pattern="\d{6}"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 rounded-lg px-4 py-2 text-white text-sm font-medium flex-1 transition-colors"
            >
              {t.disable}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDisableForm(false);
                setDisableCode("");
              }}
              className="bg-gray-500 hover:bg-gray-600 rounded-lg px-4 py-2 text-white text-sm font-medium transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      {/* Close button if provided */}
      {onClose && (
        <button
          onClick={onClose}
          className="mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 w-full"
        >
          {t.back}
        </button>
      )}
    </div>
  );
}
