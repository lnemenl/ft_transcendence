import { useState, useEffect } from "react";
import { useLanguage } from "./useLanguage";

export function TwoFactorSettings() {
  const t = useLanguage();
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // For enabling 2FA
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [verificationCode, setVerificationCode] = useState<string>("");

  // For disabling 2FA
  const [showDisableForm, setShowDisableForm] = useState<boolean>(false);
  const [disableCode, setDisableCode] = useState<string>("");

  useEffect(() => {
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

    fetchProfile();
  }, [t]);

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
      <div className="text-center">
        <p className="text-sm text-[#444746] dark:text-[#C4C7C5]">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <div>
        <p className="text-sm text-[#444746] dark:text-[#C4C7C5]">
          {t.status}: <span className={`font-500 ${isTwoFactorEnabled ? 'text-green-600 dark:text-green-400' : 'text-[#444746] dark:text-[#C4C7C5]'}`}>
            {isTwoFactorEnabled ? t.twoFactorEnabled : t.twoFactorDisabled}
          </span>
        </p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      {/* Enable 2FA Flow */}
      {!isTwoFactorEnabled && !showQRCode && (
        <div>
          <p className="text-sm text-[#444746] dark:text-[#C4C7C5] mb-3">
            {t.twoFactorExplanation}
          </p>
          <button
            onClick={handleGenerateQR}
            className="w-full px-4 py-2 text-sm font-500 bg-[#6688cc] text-white rounded-3xl hover:bg-[#5577bb] transition-colors"
          >
            {t.enableTwoFactor}
          </button>
        </div>
      )}

      {/* Show QR Code and Verification */}
      {!isTwoFactorEnabled && showQRCode && (
        <div className="space-y-4">
          <p className="text-sm text-[#444746] dark:text-[#C4C7C5]">
            {t.scanQRCode}
          </p>

          <div className="flex justify-center">
            <img src={qrCode} alt="QR Code" className="border border-[#E0E2E7] dark:border-[#49454F] rounded-2xl w-48 h-48" />
          </div>

          <div>
            <p className="text-xs text-[#444746] dark:text-[#C4C7C5] mb-2">
              {t.manualEntry}
            </p>
            <code className="block p-2 bg-[#F8F9FA] dark:bg-[#2A2A2A] rounded-2xl text-xs text-[#1F1F1F] dark:text-[#E2E2E2] break-all font-mono">
              {secret}
            </code>
          </div>

          <form onSubmit={handleEnableTwoFactor} className="space-y-3">
            <div>
              <label className="block text-sm font-500 text-[#1F1F1F] dark:text-[#E2E2E2] mb-1">
                {t.enterSixDigitCode}
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2A2A] text-[#1F1F1F] dark:text-[#E2E2E2] placeholder-[#444746] dark:placeholder-[#C4C7C5] focus:outline-none focus:ring-2 focus:ring-[#6688cc]"
                placeholder="000000"
                maxLength={6}
                pattern="\d{6}"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-500 bg-[#6688cc] text-white rounded-3xl hover:bg-[#5577bb] transition-colors"
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
                className="flex-1 px-4 py-2 text-sm font-500 border border-[#E0E2E7] dark:border-[#49454F] text-[#1F1F1F] dark:text-[#E2E2E2] rounded-3xl hover:bg-[#F0F0F0] dark:hover:bg-[#2A2A2A] transition-colors"
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
          <p className="text-sm text-[#444746] dark:text-[#C4C7C5] mb-3">
            {t.twoFactorProtected}
          </p>
          <button
            onClick={() => setShowDisableForm(true)}
            className="w-full px-4 py-2 text-sm font-500 bg-red-600 text-white rounded-3xl hover:bg-red-700 transition-colors"
          >
            {t.disableTwoFactor}
          </button>
        </div>
      )}

      {isTwoFactorEnabled && showDisableForm && (
        <form onSubmit={handleDisableTwoFactor} className="space-y-3">
          <div>
            <label className="block text-sm font-500 text-[#1F1F1F] dark:text-[#E2E2E2] mb-1">
              {t.enterSixDigitCode}
            </label>
            <input
              type="text"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2A2A] text-[#1F1F1F] dark:text-[#E2E2E2] placeholder-[#444746] dark:placeholder-[#C4C7C5] focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="000000"
              maxLength={6}
              pattern="\d{6}"
              required
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-500 bg-red-600 text-white rounded-3xl hover:bg-red-700 transition-colors"
            >
              {t.disable}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDisableForm(false);
                setDisableCode("");
              }}
              className="flex-1 px-4 py-2 text-sm font-500 border border-[#E0E2E7] dark:border-[#49454F] text-[#1F1F1F] dark:text-[#E2E2E2] rounded-3xl hover:bg-[#F0F0F0] dark:hover:bg-[#2A2A2A] transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
