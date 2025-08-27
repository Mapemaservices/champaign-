import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;
  return (
    <div style={{position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 9999, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: '#222', color: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px #0008', display: 'flex', alignItems: 'center', gap: 16}}>
        <span>Install Champagne Vault for a better experience!</span>
        <button style={{background: '#D4AF37', color: '#222', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer'}} onClick={handleInstall}>
          Install
        </button>
        <button style={{background: 'transparent', color: '#fff', border: 'none', fontSize: 20, marginLeft: 8, cursor: 'pointer'}} onClick={() => setShowPrompt(false)}>&times;</button>
      </div>
    </div>
  );
}
