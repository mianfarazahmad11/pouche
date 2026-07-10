"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

const defaultForm = {
  websiteName: "LuxeShop",
  websiteLogoUrl: "",
  faviconUrl: "/favicon.ico",
  defaultShippingCharges: 200,
  freeShippingThreshold: 5000,
  cashOnDeliveryEnabled: true,
  stripeEnabled: true,
  storePhoneNumber: "",
  storeEmailAddress: "",
  shopAddress: "",
  taxEnabled: false,
  taxPercentage: 0,
};

export default function AdminSettingsPage() {
  const { showNotification } = useStore();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, ...data }));
      } else {
        setMessage(data.error || "Failed to load settings");
        showNotification(data.error || "Failed to load settings");
      }
      setLoading(false);
    };
    load();
  }, []);

  const uploadFile = async (file, setter) => {
    if (!file) return null;
    setter(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: data });
      const result = await res.json();
      if (!res.ok) {
        setMessage(result.error || "Upload failed");
        showNotification(result.error || "Upload failed");
        return null;
      }
      showNotification("Upload successful");
      return result.url;
    } finally {
      setter(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to save settings");
        showNotification(data.error || "Failed to save settings");
      } else {
        setForm((prev) => ({ ...prev, ...data }));
        setMessage("Settings saved successfully.");
        showNotification("Settings saved successfully.");
      }
    } catch (error) {
      setMessage("Something went wrong while saving settings.");
      showNotification("Something went wrong while saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage("");

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMessage(data.error || "Failed to update password");
      } else {
        setPasswordMessage("Admin password updated successfully.");
        setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      }
    } catch (error) {
      setPasswordMessage("Something went wrong while changing password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold">Website Settings</h1>

      <form onSubmit={handleSave} className="space-y-8">
        <section className="bg-background rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-bold">Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={form.websiteName}
              onChange={(e) => setForm((prev) => ({ ...prev, websiteName: e.target.value }))}
              placeholder="Website name"
              className="p-3 border rounded-xl bg-secondary/50"
            />
            <input
              type="text"
              value={form.faviconUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, faviconUrl: e.target.value }))}
              placeholder="Favicon URL"
              className="p-3 border rounded-xl bg-secondary/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Website Logo Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const url = await uploadFile(e.target.files?.[0], setUploadingLogo);
                  if (url) setForm((prev) => ({ ...prev, websiteLogoUrl: url }));
                }}
              />
              {uploadingLogo ? <p className="text-xs text-muted-foreground">Uploading logo...</p> : null}
              {form.websiteLogoUrl ? (
                <img src={form.websiteLogoUrl} alt="Website logo" className="h-16 w-auto rounded border bg-secondary/20" />
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Favicon Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const url = await uploadFile(e.target.files?.[0], setUploadingFavicon);
                  if (url) setForm((prev) => ({ ...prev, faviconUrl: url }));
                }}
              />
              {uploadingFavicon ? <p className="text-xs text-muted-foreground">Uploading favicon...</p> : null}
              {form.faviconUrl ? (
                <img src={form.faviconUrl} alt="Favicon" className="h-10 w-10 rounded border bg-secondary/20" />
              ) : null}
            </div>
          </div>
        </section>

        <section className="bg-background rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-bold">Shipping</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              min="0"
              value={form.defaultShippingCharges}
              onChange={(e) => setForm((prev) => ({ ...prev, defaultShippingCharges: Number(e.target.value) }))}
              placeholder="Default shipping charges"
              className="p-3 border rounded-xl bg-secondary/50"
            />
            <input
              type="number"
              min="0"
              value={form.freeShippingThreshold}
              onChange={(e) => setForm((prev) => ({ ...prev, freeShippingThreshold: Number(e.target.value) }))}
              placeholder="Free shipping threshold"
              className="p-3 border rounded-xl bg-secondary/50"
            />
          </div>
        </section>

        <section className="bg-background rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-bold">Payment Methods</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.cashOnDeliveryEnabled}
                onChange={(e) => setForm((prev) => ({ ...prev, cashOnDeliveryEnabled: e.target.checked }))}
              />
              Enable Cash on Delivery
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.stripeEnabled}
                onChange={(e) => setForm((prev) => ({ ...prev, stripeEnabled: e.target.checked }))}
              />
              Enable Stripe
            </label>
          </div>
        </section>

        <section className="bg-background rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-bold">Contact</h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              value={form.storePhoneNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, storePhoneNumber: e.target.value }))}
              placeholder="Store phone number"
              className="p-3 border rounded-xl bg-secondary/50"
            />
            <input
              type="email"
              value={form.storeEmailAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, storeEmailAddress: e.target.value }))}
              placeholder="Store email address"
              className="p-3 border rounded-xl bg-secondary/50"
            />
            <textarea
              value={form.shopAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, shopAddress: e.target.value }))}
              placeholder="Shop address"
              className="p-3 border rounded-xl bg-secondary/50 min-h-24"
            />
          </div>
        </section>

        <section className="bg-background rounded-2xl border p-6 space-y-4">
          <h2 className="text-xl font-bold">Tax</h2>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.taxEnabled}
              onChange={(e) => setForm((prev) => ({ ...prev, taxEnabled: e.target.checked }))}
            />
            Enable tax
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={form.taxPercentage}
            onChange={(e) => setForm((prev) => ({ ...prev, taxPercentage: Number(e.target.value) }))}
            placeholder="Tax percentage"
            className="p-3 border rounded-xl bg-secondary/50"
          />
        </section>

        <button
          type="submit"
          disabled={saving || uploadingLogo || uploadingFavicon}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="bg-background rounded-2xl border p-6 space-y-4">
        <h2 className="text-xl font-bold">Security</h2>
        <p className="text-sm text-muted-foreground">Change admin password</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
            placeholder="Current password"
            className="p-3 border rounded-xl bg-secondary/50"
          />
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
            placeholder="New password"
            className="p-3 border rounded-xl bg-secondary/50"
          />
          <input
            type="password"
            value={passwordData.confirmNewPassword}
            onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
            placeholder="Confirm new password"
            className="p-3 border rounded-xl bg-secondary/50"
          />
        </div>
        <button
          type="submit"
          disabled={passwordLoading}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 disabled:opacity-70"
        >
          {passwordLoading ? "Updating..." : "Update Password"}
        </button>
        {passwordMessage ? <p className="text-sm font-semibold">{passwordMessage}</p> : null}
      </form>
    </div>
  );
}
