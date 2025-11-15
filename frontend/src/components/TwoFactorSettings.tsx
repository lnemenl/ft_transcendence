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
        console.log("Profile data:", data);
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
      <div className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-md">
        <p className="text-center text-gray-500 dark:text-[#cad3f5]">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        {t.twoFactorAuth}
      </h2>

      {/* Status */}
      <div className="mb-6">
        <p className="text-gray-700 dark:text-[#cad3f5] mb-2">
          {t.status}: <span className={`font-semibold ${isTwoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`}>
            {isTwoFactorEnabled ? t.twoFactorEnabled : t.twoFactorDisabled}
          </span>
        </p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 rounded">
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Enable 2FA Flow */}
      {!isTwoFactorEnabled && !showQRCode && (
        <div>
          <p className="text-sm text-gray-600 dark:text-[#cad3f5] mb-4">
            {t.twoFactorExplanation}
          </p>
          <button
            onClick={handleGenerateQR}
            className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-2 text-white w-full"
          >
            {t.enableTwoFactor}
          </button>
        </div>
      )}

      {/* Show QR Code and Verification */}
      {!isTwoFactorEnabled && showQRCode && (
        <div>
          <p className="text-sm text-gray-600 dark:text-[#cad3f5] mb-4">
            {t.scanQRCode}
          </p>

          <div className="flex justify-center mb-4">
            <img src={qrCode} alt="QR Code" className="border-2 border-gray-300 dark:border-gray-600 rounded" />
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-600 dark:text-[#cad3f5] mb-2">
              {t.manualEntry}
            </p>
            <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs break-all">
              {secret}
            </code>
          </div>

          <form onSubmit={handleEnableTwoFactor}>
            <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2">
              {t.enterSixDigitCode}
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white mb-4 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="000000"
              maxLength={6}
              pattern="\d{6}"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-2 text-white flex-1"
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
                className="bg-gray-500 hover:bg-gray-600 rounded-2xl px-6 py-2 text-white"
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
          <p className="text-sm text-gray-600 dark:text-[#cad3f5] mb-4">
            {t.twoFactorProtected}
          </p>
          <button
            onClick={() => setShowDisableForm(true)}
            className="bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-2 text-white w-full"
          >
            {t.disableTwoFactor}
          </button>
        </div>
      )}

      {isTwoFactorEnabled && showDisableForm && (
        <form onSubmit={handleDisableTwoFactor}>
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2">
            {t.enterSixDigitCode}
          </label>
          <input
            type="text"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white mb-4 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="000000"
            maxLength={6}
            pattern="\d{6}"
            required
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 rounded-2xl px-6 py-2 text-white flex-1"
            >
              {t.disable}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDisableForm(false);
                setDisableCode("");
              }}
              className="bg-gray-500 hover:bg-gray-600 rounded-2xl px-6 py-2 text-white"
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
          className="mt-6 text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700 w-full"
        >
          {t.back}
        </button>
      )}
    </div>
  );
}
