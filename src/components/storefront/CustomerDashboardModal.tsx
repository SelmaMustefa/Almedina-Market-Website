import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Settings as SettingsIcon, Check, Loader2 } from 'lucide-react';

interface CustomerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = [
  // Vibrant Character Avatars
  'https://api.dicebear.com/9.x/micah/svg?seed=Selma&backgroundColor=10b981',
  'https://api.dicebear.com/9.x/micah/svg?seed=Leo&backgroundColor=3b82f6',
  'https://api.dicebear.com/9.x/micah/svg?seed=Sara&backgroundColor=8b5cf6',
  'https://api.dicebear.com/9.x/micah/svg?seed=Omar&backgroundColor=ec4899',
  'https://api.dicebear.com/9.x/micah/svg?seed=Lily&backgroundColor=f97316',
  'https://api.dicebear.com/9.x/micah/svg?seed=Khalid&backgroundColor=06b6d4',

  // Fun Color Emojis
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Happy&backgroundColor=059669',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Smile&backgroundColor=0284c7',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Cool&backgroundColor=7c3aed',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Star&backgroundColor=db2777',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Joy&backgroundColor=ea580c',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Zen&backgroundColor=0d9488',

  // Colorful Geometric & Bottts Badges
  'https://api.dicebear.com/9.x/shapes/svg?seed=Emerald&backgroundColor=047857',
  'https://api.dicebear.com/9.x/shapes/svg?seed=Sapphire&backgroundColor=0284c7',
  'https://api.dicebear.com/9.x/shapes/svg?seed=Amethyst&backgroundColor=7c3aed',
  'https://api.dicebear.com/9.x/shapes/svg?seed=Ruby&backgroundColor=e11d48',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Neon&backgroundColor=059669',
  'https://api.dicebear.com/9.x/bottts/svg?seed=Cyber&backgroundColor=4f46e5',
];

export const CustomerDashboardModal: React.FC<CustomerDashboardModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateAccountSettings } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(currentUser?.phoneNumber || '');
      setSelectedAvatar(currentUser?.avatar || AVATAR_OPTIONS[0]);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await updateAccountSettings({ phoneNumber: phoneNumber.trim(), avatar: selectedAvatar });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in flex flex-col my-auto max-h-[calc(100dvh-2rem)]">
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-bold text-base">Settings</h2>
              <p className="text-xs text-emerald-300">Update your phone number and avatar</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Avatar selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={selectedAvatar}
                alt="Your avatar"
                className="w-16 h-16 rounded-full border-2 border-emerald-600 bg-emerald-50 object-cover"
              />
              <div>
                <p className="text-sm font-bold text-slate-900">{currentUser?.name || 'Shopper'}</p>
                <p className="text-xs text-slate-500">Choose your avatar below</p>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative rounded-full overflow-hidden border-2 transition-all ${
                    selectedAvatar === avatar
                      ? 'border-emerald-600 ring-2 ring-emerald-300'
                      : 'border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  <img src={avatar} alt="avatar option" className="w-full aspect-square object-cover bg-emerald-50" />
                  {selectedAvatar === avatar && (
                    <span className="absolute inset-0 flex items-center justify-center bg-emerald-600/30">
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Phone number */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-800">Phone Number (ET)</label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 rounded-lg bg-slate-100 border border-slate-300 text-sm font-bold text-slate-600 shrink-0">
                +251
              </span>
              <input
                type="tel"
                value={phoneNumber.replace(/^\+251/, '')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setPhoneNumber(digits ? `+251${digits}` : '');
                }}
                placeholder="911223344"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-500">Enter your Ethiopian phone number without the country code.</p>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl py-3 font-bold transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <span>Save Settings</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
