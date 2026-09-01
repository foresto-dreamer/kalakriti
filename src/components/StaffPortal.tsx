"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { auth, db } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  User,
  updateProfile
} from "firebase/auth";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";

interface StaffPortalProps {
  isOpen?: boolean;
  onClose?: () => void;
  role: "operator" | "admin";
  isFullScreen?: boolean;
}

export default function StaffPortal({ isOpen = false, onClose = () => {}, role, isFullScreen = false }: StaffPortalProps) {
  const [step, setStep] = useState<"auth" | "verify" | "dashboard">("auth");
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { t } = useTranslation();

  // Firestore Subscribed Data
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Active Admin Section Tab ("msp" | "hubs" | "staff")
  const [activeTab, setActiveTab] = useState<"msp" | "hubs" | "staff">("msp");

  // Custom in-app Modal overlays
  const [activeModal, setActiveModal] = useState<"folder" | "file" | "note" | "member" | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Modal input fields
  const [folderName, setFolderName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileFolderId, setFileFolderId] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("Operator");

  // 1. Automatically redirect to Login page when email is verified
  useEffect(() => {
    let intervalId: any;
    if (step === "verify" && auth.currentUser) {
      intervalId = setInterval(async () => {
        try {
          await auth.currentUser?.reload();
          if (auth.currentUser?.emailVerified) {
            clearInterval(intervalId);
            await signOut(auth);
            setStep("auth");
            setErrorMsg("Email verified successfully! Please log in.");
          }
        } catch (err) {
          console.error("Error checking verification status:", err);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step]);

  // 2. Real-time Firestore subscriptions for logged in User
  useEffect(() => {
    if (!user || step !== "dashboard") {
      setFolders([]);
      setFiles([]);
      setNotes([]);
      setMembers([]);
      return;
    }

    const unsubFolders = onSnapshot(collection(db, "users", user.uid, "folders"), (snap) => {
      setFolders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Folders subscription error:", err));

    const unsubFiles = onSnapshot(collection(db, "users", user.uid, "files"), (snap) => {
      setFiles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Files subscription error:", err));

    const unsubNotes = onSnapshot(collection(db, "users", user.uid, "notes"), (snap) => {
      setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Notes subscription error:", err));

    const unsubMembers = onSnapshot(collection(db, "users", user.uid, "members"), (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Members subscription error:", err));

    return () => {
      unsubFolders();
      unsubFiles();
      unsubNotes();
      unsubMembers();
    };
  }, [user, step]);

  // 3. Modal submit handlers
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setIsModalSubmitting(true);
    setModalError("");
    try {
      await addDoc(collection(db, "users", user!.uid, "folders"), {
        name: folderName.trim(),
        createdAt: new Date().toISOString()
      });
      setFolderName("");
      setActiveModal(null);
    } catch (err: any) {
      console.error("Create folder error:", err);
      setModalError(err.message || "Failed to create folder.");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileSize.trim()) return;
    setIsModalSubmitting(true);
    setModalError("");
    try {
      await addDoc(collection(db, "users", user!.uid, "files"), {
        name: fileName.trim(),
        folderId: fileFolderId || "",
        size: fileSize.trim(),
        createdAt: new Date().toISOString()
      });
      setFileName("");
      setFileFolderId("");
      setFileSize("");
      setActiveModal(null);
    } catch (err: any) {
      console.error("Add file error:", err);
      setModalError(err.message || "Failed to add file.");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setIsModalSubmitting(true);
    setModalError("");
    try {
      await addDoc(collection(db, "users", user!.uid, "notes"), {
        title: noteTitle.trim(),
        content: noteContent.trim(),
        createdAt: new Date().toISOString()
      });
      setNoteTitle("");
      setNoteContent("");
      setActiveModal(null);
    } catch (err: any) {
      console.error("Create note error:", err);
      setModalError(err.message || "Failed to create note.");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberRole.trim()) return;
    setIsModalSubmitting(true);
    setModalError("");
    try {
      await addDoc(collection(db, "users", user!.uid, "members"), {
        name: memberName.trim(),
        role: memberRole.trim(),
        createdAt: new Date().toISOString()
      });
      setMemberName("");
      setMemberRole("Operator");
      setActiveModal(null);
    } catch (err: any) {
      console.error("Add member error:", err);
      setModalError(err.message || "Failed to add member.");
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const handleDeleteItem = async (colName: string, id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, colName, id));
    } catch (err) {
      console.error(`Failed to delete item from ${colName}:`, err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.emailVerified) {
          // Enforce role check on state recovery
          const sessionRole = typeof window !== "undefined" ? sessionStorage.getItem("kisansetu_role") : null;
          if (sessionRole === role) {
            setUser(firebaseUser);
            setStep("dashboard");
          } else {
            setUser(null);
            setStep("auth");
          }
        } else {
          // If we detect an unverified user on load, sign them out and show auth screen
          signOut(auth);
          setUser(null);
          setStep("auth");
        }
      } else {
        setUser(null);
        if (step === "dashboard") {
          setStep("auth");
        }
      }
    });
    return () => unsubscribe();
  }, [role, step]);

  // Reset local state when modal opens/closes or role changes
  useEffect(() => {
    if (isOpen || isFullScreen) {
      // Check if there is already a verified user matching the role
      const currentUser = auth.currentUser;
      const sessionRole = typeof window !== "undefined" ? sessionStorage.getItem("kisansetu_role") : null;
      if (currentUser && currentUser.emailVerified && sessionRole === role) {
        setUser(currentUser);
        setStep("dashboard");
      } else {
        setStep("auth");
      }
      setIsSignUp(false);
      setFirstName("");
      setLastName("");
      setPassword("");
      setErrorMsg("");
    }
  }, [isOpen, role, isFullScreen]);

  if (!isOpen && !isFullScreen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const userObj = result.user;

        // Set Display Name (First Name + Last Name)
        await updateProfile(userObj, {
          displayName: `${firstName.trim()} ${lastName.trim()}`
        });
        
        // Send email verification
        try {
          await sendEmailVerification(userObj);
        } catch (verifErr: any) {
          console.warn("Failed to send verification email:", verifErr);
          setErrorMsg("Account created, but failed to send verification email: " + (verifErr.message || verifErr));
          setIsSubmitting(false);
          return;
        }
        
        // Sign out and show verification screen for first-time signup
        await signOut(auth);
        setStep("verify");
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userObj = result.user;

        // Block access if email is not verified on sign-in
        if (!userObj.emailVerified) {
          await signOut(auth);
          setStep("verify");
        } else {
          if (typeof window !== "undefined") {
            sessionStorage.setItem("kisansetu_role", role);
          }
          setUser(userObj);
          setStep("dashboard");
        }
      }
    } catch (error: any) {
      console.warn("Auth error:", error);
      if (isSignUp) {
        if (error.code === "auth/email-already-in-use") {
          setErrorMsg("User already exists. Please sign in");
        } else {
          setErrorMsg(error.message || "An error occurred during sign up.");
        }
      } else {
        if (
          error.code === "auth/wrong-password" ||
          error.code === "auth/user-not-found" ||
          error.code === "auth/invalid-credential" ||
          error.code === "auth/invalid-email"
        ) {
          setErrorMsg("Email or password is incorrect");
        } else {
          setErrorMsg("Email or password is incorrect");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const userObj = result.user;

      if (typeof window !== "undefined") {
        sessionStorage.setItem("kisansetu_role", role);
      }
      setUser(userObj);
      setStep("dashboard");
    } catch (error: any) {
      console.warn("Google sign in error:", error);
      setErrorMsg(error.message || "Google Sign-In failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("kisansetu_role");
      }
      setEmail("");
      setPassword("");
      setStep("auth");
    } catch (error) {
      console.warn("Logout error:", error);
    }
  };

  if (isFullScreen) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col">
        {step === "dashboard" ? (
          <>
            {/* Header */}
            <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <a href="/" className="flex items-center space-x-2">
                  <span className="text-xl font-bold tracking-tight">
                    <span className="text-emerald-400">Kisan</span>Setu
                  </span>
                </a>
                <span className="text-slate-400 text-xs px-2.5 py-0.5 rounded-full border border-slate-800 bg-slate-850 font-semibold">
                  {role === "admin" ? "Admin Console" : "Operator Console"}
                </span>
              </div>

              <a
                href="/"
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-semibold flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                Go to Home
              </a>
            </header>

            {/* Dashboard Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {role === "operator" && (
                <div className="space-y-6 py-2 animate-fade-in-up">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">Operator Dashboard</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Logged in as: <span className="font-semibold text-blue-600">{user?.displayName ? `${user.displayName} (${user.email})` : user?.email}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold bg-white hover:bg-red-50 text-red-600 hover:text-red-700 px-4 py-2 rounded-full border border-slate-200 transition-all cursor-pointer"
                    >
                      Logout Portal
                    </button>
                  </div>

                  {/* Operator Action Controls */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <h5 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Active Procurement Hub Controls</h5>
                    <p className="text-xs text-slate-500">Perform gate verification and queue management operations for arriving tractors.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                        <h6 className="font-bold text-slate-800 text-sm">Scan Gate Token</h6>
                        <p className="text-xs text-slate-400">Verify digital ticket tokens at gate entry.</p>
                        <button 
                          onClick={() => alert("Scanner initialization failed: No camera detected.")}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Open Scanner
                        </button>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                        <h6 className="font-bold text-slate-800 text-sm">Advance Queue</h6>
                        <p className="text-xs text-slate-400">Call the next waiting vehicle to the scale.</p>
                        <button 
                          onClick={() => alert("Simulating next token...")}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Call Next Token
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role === "admin" && (
                <div className="space-y-6 py-2 animate-fade-in-up">
                  {/* Welcome Header Banner */}
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-600/10">
                    <div>
                      <h4 className="text-2xl font-black">Welcome, {user?.displayName ? user.displayName.split(" ")[0] : "Admin"}!</h4>
                      <p className="text-xs text-amber-100 mt-1">
                        Logged in as: <span className="font-semibold text-white">{user?.email}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
                    >
                      Logout Portal
                    </button>
                  </div>

                  {/* SaaS Metric cards with Add Buttons */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Folders Metric */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Folders</span>
                        <button
                          onClick={() => {
                            setModalError("");
                            setActiveModal("folder");
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold"
                          title="Create Folder"
                        >
                          + New
                        </button>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{folders.length}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Directories created</p>
                      </div>
                    </div>

                    {/* Files Metric */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Files</span>
                        <button
                          onClick={() => {
                            setModalError("");
                            setActiveModal("file");
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold"
                          title="Add File"
                        >
                          + Add
                        </button>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{files.length}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Documents uploaded</p>
                      </div>
                    </div>

                    {/* Notes Metric */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</span>
                        <button
                          onClick={() => {
                            setModalError("");
                            setActiveModal("note");
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold"
                          title="Create Note"
                        >
                          + Note
                        </button>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{notes.length}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Mandi reminders</p>
                      </div>
                    </div>

                    {/* Members/Staff Metric */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff</span>
                        <button
                          onClick={() => {
                            setModalError("");
                            setActiveModal("member");
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold"
                          title="Add Member"
                        >
                          + Staff
                        </button>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{members.length}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Active operators</p>
                      </div>
                    </div>
                  </div>

                  {/* Section Tabs Selector */}
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button
                      onClick={() => setActiveTab("msp")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "msp" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      1) MSP Rates
                    </button>
                    <button
                      onClick={() => setActiveTab("hubs")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "hubs" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      2) Manage Hubs
                    </button>
                    <button
                      onClick={() => setActiveTab("staff")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "staff" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      3) Manage Staff
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[250px]">
                    {/* Tab 1: MSP Rates & Notes */}
                    {activeTab === "msp" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-base font-black text-slate-900">Minimum Support Price (MSP) Rates</h5>
                            <p className="text-xs text-slate-400">Current government procurement rates per quintal.</p>
                          </div>
                          <button
                            onClick={() => {
                              setModalError("");
                              setActiveModal("note");
                            }}
                            className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            + Add Mandi Note
                          </button>
                        </div>

                        {/* Seeded MSP Rates Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-150">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                                <th className="p-3">Crop Name</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">MSP Rate (₹/Quintal)</th>
                                <th className="p-3">Effective Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                <td className="p-3">Paddy (Common)</td>
                                <td className="p-3 text-slate-500 font-normal">Kharif</td>
                                <td className="p-3">₹2,300</td>
                                <td className="p-3 text-slate-400 font-normal">Oct 1, 2026</td>
                              </tr>
                              <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                <td className="p-3">Wheat</td>
                                <td className="p-3 text-slate-500 font-normal">Rabi</td>
                                <td className="p-3">₹2,425</td>
                                <td className="p-3 text-slate-400 font-normal">Apr 1, 2026</td>
                              </tr>
                              <tr className="text-slate-700 font-bold">
                                <td className="p-3">Mustard Seed</td>
                                <td className="p-3 text-slate-500 font-normal">Rabi</td>
                                <td className="p-3">₹5,950</td>
                                <td className="p-3 text-slate-400 font-normal">Mar 1, 2026</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Dynamic Notes from Firestore */}
                        <div className="space-y-3 pt-2">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mandi Notices & Reminders</h6>
                          {notes.length === 0 ? (
                            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                              No notices added yet. Click "+ Add Mandi Note" to save to Firestore.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {notes.map((note) => (
                                <div key={note.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl relative group">
                                  <button
                                    onClick={() => handleDeleteItem("notes", note.id)}
                                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-600 hover:bg-white rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                    title="Delete Note"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.72 0-.34-6M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                  </button>
                                  <h6 className="font-bold text-slate-800 text-sm">{note.title}</h6>
                                  <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{note.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Manage Hubs */}
                    {activeTab === "hubs" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-base font-black text-slate-900">Manage Hubs & Document Repository</h5>
                            <p className="text-xs text-slate-400">Configure procurement centers and upload reference documents.</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setModalError("");
                                setActiveModal("folder");
                              }}
                              className="text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              + New Folder
                            </button>
                            <button
                              onClick={() => {
                                setModalError("");
                                setActiveModal("file");
                              }}
                              className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              + Add File
                            </button>
                          </div>
                        </div>

                        {/* Seeded Hubs List */}
                        <div className="space-y-3">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Central Mandi Hubs</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                              <div>
                                <h6 className="font-bold text-emerald-900 text-sm">Central Hub A - Karnal</h6>
                                <p className="text-xs text-emerald-700">Location: Haryana | Capacity: 5,000 MT</p>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">Active</span>
                            </div>
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                              <div>
                                <h6 className="font-bold text-emerald-900 text-sm">Central Hub B - Bhatinda</h6>
                                <p className="text-xs text-emerald-700">Location: Punjab | Capacity: 8,000 MT</p>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">Active</span>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Folders & Files */}
                        <div className="space-y-3 pt-2">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Folder & Document File Directory</h6>
                          {folders.length === 0 && files.length === 0 ? (
                            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                              No folders or files saved to Firestore. Create a folder or add a file using the buttons above.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Folders display */}
                              {folders.map(folder => {
                                const folderFiles = files.filter(f => f.folderId === folder.id);
                                return (
                                  <div key={folder.id} className="p-4 border border-slate-150 rounded-2xl bg-slate-50/40 relative group">
                                    <button
                                      onClick={() => handleDeleteItem("folders", folder.id)}
                                      className="absolute top-3 right-3 text-slate-300 hover:text-red-600 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                      title="Delete Folder"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.72 0-.34-6M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                      </svg>
                                    </button>
                                    <div className="flex items-center gap-2 mb-2 text-slate-700">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
                                        <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V9a3 3 0 0 0-3-3h-3.32a3 3 0 0 1-2.24-1L8.58 3.92A3 3 0 0 0 6.34 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Z" />
                                      </svg>
                                      <span className="font-bold text-sm">{folder.name}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7">
                                      {folderFiles.length === 0 ? (
                                        <span className="text-xs text-slate-400 italic">Folder is empty</span>
                                      ) : (
                                        folderFiles.map(file => (
                                          <div key={file.id} className="p-2 bg-white border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                                            <span className="text-slate-700 font-medium truncate pr-2">{file.name}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-400">{file.size}</span>
                                              <button
                                                onClick={() => handleDeleteItem("files", file.id)}
                                                className="text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.72 0-.34-6" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Root files (no folder) */}
                              {files.filter(f => !f.folderId).length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unsorted Documents</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {files.filter(f => !f.folderId).map(file => (
                                      <div key={file.id} className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between text-xs relative group">
                                        <span className="text-slate-700 font-bold truncate pr-2">{file.name}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-400 font-medium">{file.size}</span>
                                          <button
                                            onClick={() => handleDeleteItem("files", file.id)}
                                            className="text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                                            title="Delete File"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Manage Staff */}
                    {activeTab === "staff" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-base font-black text-slate-900">Manage Staff Directory</h5>
                            <p className="text-xs text-slate-400">Add, edit, or remove procurement staff members and assign roles.</p>
                          </div>
                          <button
                            onClick={() => {
                              setModalError("");
                              setActiveModal("member");
                            }}
                            className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            + Add Staff Member
                          </button>
                        </div>

                        {/* Seeded and dynamic staff list */}
                        <div className="space-y-3">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Staff & Operators</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Seeded values */}
                            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">SM</div>
                                <div>
                                  <h6 className="font-bold text-slate-800 text-sm">Sharan Mahapatra</h6>
                                  <p className="text-xs text-slate-500">Mandi Gate operator</p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold">Default</span>
                            </div>

                            {/* Dynamic Firestore staff */}
                            {members.map(member => (
                              <div key={member.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between relative group">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-extrabold text-sm">
                                    {member.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <h6 className="font-bold text-slate-800 text-sm">{member.name}</h6>
                                    <p className="text-xs text-slate-500">{member.role}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteItem("members", member.id)}
                                  className="text-slate-300 hover:text-red-600 p-1 rounded-lg hover:bg-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                  title="Delete Staff"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.72 0-.34-6M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </>
        ) : (
          <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Gradients */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 -z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-900/15 via-transparent to-transparent -z-10" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
              <a href="/" className="inline-flex items-center space-x-2">
                <span className="text-3xl font-black tracking-tight select-none">
                  <span className="text-emerald-400">Kisan</span>
                  <span className="text-white">Setu</span>
                </span>
              </a>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col animate-fade-in-up">
                {/* Header / Info */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <span className="text-slate-500 text-xs px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 font-bold uppercase tracking-wider">
                    {role === "admin" ? "Admin Console" : "Operator Portal"}
                  </span>
                  <a href="/" className="text-xs text-emerald-600 hover:text-emerald-500 font-bold flex items-center gap-1">
                    ← Back to Home
                  </a>
                </div>

                {/* Auth/Verify Steps */}
                {step === "auth" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">
                        {role === "admin" 
                          ? (isSignUp ? "Register Admin Account" : "Admin Command Login")
                          : (isSignUp ? "Register Operator Account" : "Operator Portal Login")
                        }
                      </h3>
                      <p className="text-sm text-slate-500">
                        {isSignUp
                          ? "Create credentials to manage and run the KisanSetu platform."
                          : "Enter your verified credentials to access the console."}
                      </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                      {errorMsg && (
                        <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold text-xs">
                          ⚠️ {errorMsg}
                        </div>
                      )}

                      {isSignUp && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                              First Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="John"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-800 text-sm font-bold shadow-inner ${
                                role === "admin" ? "focus:ring-amber-500" : "focus:ring-blue-500"
                              }`}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                              Last Name
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Doe"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-800 text-sm font-bold shadow-inner ${
                                role === "admin" ? "focus:ring-amber-500" : "focus:ring-blue-500"
                              }`}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="name@kisansetu.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setErrorMsg("");
                          }}
                          className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-800 text-sm font-bold shadow-inner ${
                            role === "admin" ? "focus:ring-amber-500" : "focus:ring-blue-500"
                          }`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrorMsg("");
                          }}
                          className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-800 text-sm font-bold shadow-inner ${
                            role === "admin" ? "focus:ring-amber-500" : "focus:ring-blue-500"
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full text-white font-bold text-sm py-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center ${
                          role === "admin" 
                            ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/10" 
                            : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/10"
                        }`}
                      >
                        {isSubmitting
                          ? (isSignUp ? "Sending verification..." : "Signing In...")
                          : (isSignUp ? "Register & Send Verification" : "Sign In")}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">or</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    {/* Google Sign In Button */}
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isSubmitting}
                      className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm py-3.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-3"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      Sign In with Google
                    </button>

                    {/* Security Warning Notice */}
                    <p className="text-[11px] text-slate-500 mt-2.5 text-center font-bold tracking-wide flex items-center justify-center gap-1.5 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Only Authenticated Users Will Be Able To Login
                    </p>

                    <div className="text-center pt-2">
                      <button
                        onClick={() => {
                          setIsSignUp(!isSignUp);
                          setErrorMsg("");
                          setPassword("");
                        }}
                        className={`text-xs font-bold cursor-pointer ${
                          role === "admin" ? "text-slate-500 hover:text-amber-600" : "text-slate-500 hover:text-blue-600"
                        }`}
                      >
                        {isSignUp
                          ? "Already have an account? Sign In"
                          : "Don't have an account? Sign Up"}
                      </button>
                    </div>
                  </div>
                )}

                {step === "verify" && (
                  <div className="space-y-6 text-center">
                    <div className="space-y-3">
                      <h3 className="text-2xl font-black text-slate-900">Verify Your Email</h3>
                      <p className="text-sm text-slate-500 leading-relaxed px-4">
                        We have sent you a verification email to <span className="font-bold text-slate-800">{email}</span>. Please verify it and log in.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setStep("auth");
                        setPassword("");
                        setErrorMsg("");
                      }}
                      className={`w-full text-white font-bold text-sm py-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center ${
                        role === "admin" 
                          ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/10" 
                          : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/10"
                      }`}
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Modals Overlays (NO BROWSER PROMPTS) */}
        {activeModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-slate-900">
                  {activeModal === "folder" && "New Folder"}
                  {activeModal === "file" && "Add Document File"}
                  {activeModal === "note" && "New Mandi Note"}
                  {activeModal === "member" && "Add Staff Member"}
                </h4>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                  ⚠️ {modalError}
                </div>
              )}

              {/* Folder Modal Form */}
              {activeModal === "folder" && (
                <form onSubmit={handleCreateFolder} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Folder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Haryana Mandi Reports"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isModalSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/10 cursor-pointer disabled:opacity-50"
                    >
                      {isModalSubmitting ? "Creating..." : "Create Folder"}
                    </button>
                  </div>
                </form>
              )}

              {/* File Modal Form */}
              {activeModal === "file" && (
                <form onSubmit={handleAddFile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      File Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ProcurementGuidelines.pdf"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Folder (Optional)
                    </label>
                    <select
                      value={fileFolderId}
                      onChange={(e) => setFileFolderId(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                    >
                      <option value="">Root / Unsorted</option>
                      {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      File Size
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1.2 MB or 450 KB"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isModalSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/10 cursor-pointer disabled:opacity-50"
                    >
                      {isModalSubmitting ? "Adding..." : "Add File"}
                    </button>
                  </div>
                </form>
              )}

              {/* Note Modal Form */}
              {activeModal === "note" && (
                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Note Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gate 3 Maintenance"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Content
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. Gate 3 scales will be offline for calibration tomorrow between 2 PM and 4 PM."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner resize-none"
                    />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isModalSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/10 cursor-pointer disabled:opacity-50"
                    >
                      {isModalSubmitting ? "Saving..." : "Save Note"}
                    </button>
                  </div>
                </form>
              )}

              {/* Member Modal Form */}
              {activeModal === "member" && (
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Member Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Assign Role
                    </label>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                    >
                      <option value="Operator">Operator</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Mandi Manager">Mandi Manager</option>
                    </select>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isModalSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/10 cursor-pointer disabled:opacity-50"
                    >
                      {isModalSubmitting ? "Adding..." : "Add Member"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 py-8">
      {/* Modal Card */}
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-fade-in-up">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">
              <span className="text-emerald-400">Kisan</span>Setu
            </span>
            <span className="text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-800 bg-slate-850">
              {role === "admin" ? "Admin Panel" : "Operator Portal"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50">
          {step === "auth" && (
            <div className="max-w-md mx-auto py-4 space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-black text-slate-900">
                  {role === "admin" 
                    ? (isSignUp ? "Register Admin Account" : "Admin Command Login")
                    : (isSignUp ? "Register Operator Account" : "Operator Portal Login")
                  }
                </h3>
                <p className="text-sm text-slate-500">
                  {isSignUp
                    ? "Create credentials to manage and run the KisanSetu platform."
                    : "Enter your verified credentials to access the console."}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {errorMsg && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 font-bold text-xs">
                    ⚠️ {errorMsg}
                  </div>
                )}

                {isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-800 text-sm font-bold shadow-inner ${
                          role === "admin" ? "focus:ring-amber-500" : "focus:ring-blue-500"
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-800 text-sm font-bold shadow-inner ${
                          role === "admin" ? "focus:ring-amber-500" : "focus:ring-blue-500"
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@kisansetu.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMsg("");
                    }}
                    className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-800 text-sm font-bold shadow-inner ${
                      role === "admin" ? "focus:ring-amber-500" : "focus:ring-blue-500"
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    className={`w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 text-slate-800 text-sm font-bold shadow-inner ${
                      role === "admin" ? "focus:ring-amber-500" : "focus:ring-blue-500"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full text-white font-bold text-sm py-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center ${
                    role === "admin" 
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/10" 
                      : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/10"
                  }`}
                >
                  {isSubmitting
                    ? (isSignUp ? "Sending verification..." : "Signing In...")
                    : (isSignUp ? "Register & Send Verification" : "Sign In")}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm py-3.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sign In with Google
              </button>

              {/* Security Warning Notice */}
              <p className="text-[11px] text-slate-500 mt-2.5 text-center font-bold tracking-wide flex items-center justify-center gap-1.5 bg-slate-50 py-1.5 px-3 rounded-xl border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Only Authenticated Users Will Be Able To Login
              </p>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setErrorMsg("");
                    setPassword("");
                  }}
                  className={`text-xs font-bold cursor-pointer ${
                    role === "admin" ? "text-slate-500 hover:text-amber-600" : "text-slate-500 hover:text-blue-600"
                  }`}
                >
                  {isSignUp
                    ? "Already have an account? Sign In"
                    : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          )}

          {step === "verify" && (
            <div className="max-w-md mx-auto py-8 space-y-6 text-center">
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900">Verify Your Email</h3>
                <p className="text-sm text-slate-500 leading-relaxed px-4">
                  We have sent you a verification email to <span className="font-bold text-slate-800">{email}</span>. Please verify it and log in.
                </p>
              </div>

              <button
                onClick={() => {
                  setStep("auth");
                  setPassword("");
                  setErrorMsg("");
                }}
                className={`w-full text-white font-bold text-sm py-4 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center ${
                  role === "admin" 
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/10" 
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/10"
                }`}
              >
                Go to Login
              </button>
            </div>
          )}

          {step === "dashboard" && (
            <>
              {role === "operator" && (
                <div className="space-y-6 py-2 animate-fade-in-up">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">Operator Dashboard</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Logged in as: <span className="font-semibold text-blue-600">{user?.displayName ? `${user.displayName} (${user.email})` : user?.email}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold bg-white hover:bg-red-50 text-red-600 hover:text-red-700 px-4 py-2 rounded-full border border-slate-200 transition-all cursor-pointer"
                    >
                      Logout Portal
                    </button>
                  </div>

                  {/* Operator Action Controls */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <h5 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Active Procurement Hub Controls</h5>
                    <p className="text-xs text-slate-500">Perform gate verification and queue management operations for arriving tractors.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                        <h6 className="font-bold text-slate-800 text-sm">Scan Gate Token</h6>
                        <p className="text-xs text-slate-400">Verify digital ticket tokens at gate entry.</p>
                        <button 
                          onClick={() => alert("Scanner initialization failed: No camera detected.")}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Open Scanner
                        </button>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                        <h6 className="font-bold text-slate-800 text-sm">Advance Queue</h6>
                        <p className="text-xs text-slate-400">Call the next waiting vehicle to the scale.</p>
                        <button 
                          onClick={() => alert("Simulating next token...")}
                          className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Call Next Token
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {role === "admin" && (
                <div className="space-y-6 py-2 animate-fade-in-up">
                  {/* Welcome Header Banner */}
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-600/10">
                    <div>
                      <h4 className="text-2xl font-black">Welcome, {user?.displayName ? user.displayName.split(" ")[0] : "Admin"}!</h4>
                      <p className="text-xs text-amber-100 mt-1">
                        Logged in as: <span className="font-semibold text-white">{user?.email}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
                    >
                      Logout Portal
                    </button>
                  </div>

                  {/* SaaS Metric cards with Add Buttons */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Folders Metric */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Folders</span>
                        <button
                          onClick={() => {
                            setModalError("");
                            setActiveModal("folder");
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold"
                          title="Create Folder"
                        >
                          + New
                        </button>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{folders.length}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Directories created</p>
                      </div>
                    </div>

                    {/* Files Metric */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Files</span>
                        <button
                          onClick={() => {
                            setModalError("");
                            setActiveModal("file");
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold"
                          title="Add File"
                        >
                          + Add
                        </button>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{files.length}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Documents uploaded</p>
                      </div>
                    </div>

                    {/* Notes Metric */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</span>
                        <button
                          onClick={() => {
                            setModalError("");
                            setActiveModal("note");
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold"
                          title="Create Note"
                        >
                          + Note
                        </button>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{notes.length}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Mandi reminders</p>
                      </div>
                    </div>

                    {/* Members/Staff Metric */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff</span>
                        <button
                          onClick={() => {
                            setModalError("");
                            setActiveModal("member");
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer text-xs font-bold"
                          title="Add Member"
                        >
                          + Staff
                        </button>
                      </div>
                      <div>
                        <span className="text-3xl font-black text-slate-800">{members.length}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Active operators</p>
                      </div>
                    </div>
                  </div>

                  {/* Section Tabs Selector */}
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button
                      onClick={() => setActiveTab("msp")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "msp" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      1) MSP Rates
                    </button>
                    <button
                      onClick={() => setActiveTab("hubs")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "hubs" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      2) Manage Hubs
                    </button>
                    <button
                      onClick={() => setActiveTab("staff")}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "staff" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      3) Manage Staff
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm min-h-[250px]">
                    {/* Tab 1: MSP Rates & Notes */}
                    {activeTab === "msp" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-base font-black text-slate-900">Minimum Support Price (MSP) Rates</h5>
                            <p className="text-xs text-slate-400">Current government procurement rates per quintal.</p>
                          </div>
                          <button
                            onClick={() => {
                              setModalError("");
                              setActiveModal("note");
                            }}
                            className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            + Add Mandi Note
                          </button>
                        </div>

                        {/* Seeded MSP Rates Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-150">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                                <th className="p-3">Crop Name</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">MSP Rate (₹/Quintal)</th>
                                <th className="p-3">Effective Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                <td className="p-3">Paddy (Common)</td>
                                <td className="p-3 text-slate-500 font-normal">Kharif</td>
                                <td className="p-3">₹2,300</td>
                                <td className="p-3 text-slate-400 font-normal">Oct 1, 2026</td>
                              </tr>
                              <tr className="border-b border-slate-100 text-slate-700 font-bold">
                                <td className="p-3">Wheat</td>
                                <td className="p-3 text-slate-500 font-normal">Rabi</td>
                                <td className="p-3">₹2,425</td>
                                <td className="p-3 text-slate-400 font-normal">Apr 1, 2026</td>
                              </tr>
                              <tr className="text-slate-700 font-bold">
                                <td className="p-3">Mustard Seed</td>
                                <td className="p-3 text-slate-500 font-normal">Rabi</td>
                                <td className="p-3">₹5,950</td>
                                <td className="p-3 text-slate-400 font-normal">Mar 1, 2026</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Dynamic Notes from Firestore */}
                        <div className="space-y-3 pt-2">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Mandi Notices & Reminders</h6>
                          {notes.length === 0 ? (
                            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                              No notices added yet. Click "+ Add Mandi Note" to save to Firestore.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {notes.map((note) => (
                                <div key={note.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl relative group">
                                  <button
                                    onClick={() => handleDeleteItem("notes", note.id)}
                                    className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-600 hover:bg-white rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                    title="Delete Note"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.72 0-.34-6M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                  </button>
                                  <h6 className="font-bold text-slate-800 text-sm">{note.title}</h6>
                                  <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{note.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Manage Hubs */}
                    {activeTab === "hubs" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-base font-black text-slate-900">Manage Hubs & Document Repository</h5>
                            <p className="text-xs text-slate-400">Configure procurement centers and upload reference documents.</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setModalError("");
                                setActiveModal("folder");
                              }}
                              className="text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              + New Folder
                            </button>
                            <button
                              onClick={() => {
                                setModalError("");
                                setActiveModal("file");
                              }}
                              className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              + Add File
                            </button>
                          </div>
                        </div>

                        {/* Seeded Hubs List */}
                        <div className="space-y-3">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Central Mandi Hubs</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                              <div>
                                <h6 className="font-bold text-emerald-900 text-sm">Central Hub A - Karnal</h6>
                                <p className="text-xs text-emerald-700">Location: Haryana | Capacity: 5,000 MT</p>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">Active</span>
                            </div>
                            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                              <div>
                                <h6 className="font-bold text-emerald-900 text-sm">Central Hub B - Bhatinda</h6>
                                <p className="text-xs text-emerald-700">Location: Punjab | Capacity: 8,000 MT</p>
                              </div>
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">Active</span>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Folders & Files */}
                        <div className="space-y-3 pt-2">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Folder & Document File Directory</h6>
                          {folders.length === 0 && files.length === 0 ? (
                            <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                              No folders or files saved to Firestore. Create a folder or add a file using the buttons above.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Folders display */}
                              {folders.map(folder => {
                                const folderFiles = files.filter(f => f.folderId === folder.id);
                                return (
                                  <div key={folder.id} className="p-4 border border-slate-150 rounded-2xl bg-slate-50/40 relative group">
                                    <button
                                      onClick={() => handleDeleteItem("folders", folder.id)}
                                      className="absolute top-3 right-3 text-slate-300 hover:text-red-600 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                      title="Delete Folder"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.72 0-.34-6M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                      </svg>
                                    </button>
                                    <div className="flex items-center gap-2 mb-2 text-slate-700">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500">
                                        <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V9a3 3 0 0 0-3-3h-3.32a3 3 0 0 1-2.24-1L8.58 3.92A3 3 0 0 0 6.34 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Z" />
                                      </svg>
                                      <span className="font-bold text-sm">{folder.name}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7">
                                      {folderFiles.length === 0 ? (
                                        <span className="text-xs text-slate-400 italic">Folder is empty</span>
                                      ) : (
                                        folderFiles.map(file => (
                                          <div key={file.id} className="p-2 bg-white border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                                            <span className="text-slate-700 font-medium truncate pr-2">{file.name}</span>
                                            <div className="flex items-center gap-2">
                                              <span className="text-slate-400">{file.size}</span>
                                              <button
                                                onClick={() => handleDeleteItem("files", file.id)}
                                                className="text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.72 0-.34-6" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Root files (no folder) */}
                              {files.filter(f => !f.folderId).length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unsorted Documents</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {files.filter(f => !f.folderId).map(file => (
                                      <div key={file.id} className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between text-xs relative group">
                                        <span className="text-slate-700 font-bold truncate pr-2">{file.name}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-slate-400 font-medium">{file.size}</span>
                                          <button
                                            onClick={() => handleDeleteItem("files", file.id)}
                                            className="text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                                            title="Delete File"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Manage Staff */}
                    {activeTab === "staff" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-base font-black text-slate-900">Manage Staff Directory</h5>
                            <p className="text-xs text-slate-400">Add, edit, or remove procurement staff members and assign roles.</p>
                          </div>
                          <button
                            onClick={() => {
                              setModalError("");
                              setActiveModal("member");
                            }}
                            className="text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            + Add Staff Member
                          </button>
                        </div>

                        {/* Seeded and dynamic staff list */}
                        <div className="space-y-3">
                          <h6 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Staff & Operators</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Seeded values */}
                            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600">SM</div>
                                <div>
                                  <h6 className="font-bold text-slate-800 text-sm">Sharan Mahapatra</h6>
                                  <p className="text-xs text-slate-500">Mandi Gate operator</p>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold">Default</span>
                            </div>

                            {/* Dynamic Firestore staff */}
                            {members.map(member => (
                              <div key={member.id} className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-between relative group">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-extrabold text-sm">
                                    {member.name.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <h6 className="font-bold text-slate-800 text-sm">{member.name}</h6>
                                    <p className="text-xs text-slate-500">{member.role}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleDeleteItem("members", member.id)}
                                  className="text-slate-300 hover:text-red-600 p-1 rounded-lg hover:bg-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                  title="Delete Staff"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.72 0-.34-6M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dynamic Modals Overlays (NO BROWSER PROMPTS) */}
      {activeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black text-slate-900">
                {activeModal === "folder" && "New Folder"}
                {activeModal === "file" && "Add Document File"}
                {activeModal === "note" && "New Mandi Note"}
                {activeModal === "member" && "Add Staff Member"}
              </h4>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
                ⚠️ {modalError}
              </div>
            )}

            {/* Folder Modal Form */}
            {activeModal === "folder" && (
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Folder Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Haryana Mandi Reports"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isModalSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {isModalSubmitting ? "Creating..." : "Create Folder"}
                  </button>
                </div>
              </form>
            )}

            {/* File Modal Form */}
            {activeModal === "file" && (
              <form onSubmit={handleAddFile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    File Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ProcurementGuidelines.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Folder (Optional)
                  </label>
                  <select
                    value={fileFolderId}
                    onChange={(e) => setFileFolderId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                  >
                    <option value="">Root / Unsorted</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    File Size
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.2 MB or 450 KB"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isModalSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {isModalSubmitting ? "Adding..." : "Add File"}
                  </button>
                </div>
              </form>
            )}

            {/* Note Modal Form */}
            {activeModal === "note" && (
              <form onSubmit={handleCreateNote} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Note Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gate 3 Maintenance"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Content
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Gate 3 scales will be offline for calibration tomorrow between 2 PM and 4 PM."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isModalSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {isModalSubmitting ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </form>
            )}

            {/* Member Modal Form */}
            {activeModal === "member" && (
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Member Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Assign Role
                  </label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold shadow-inner"
                  >
                    <option value="Operator">Operator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Mandi Manager">Mandi Manager</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isModalSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/10 cursor-pointer disabled:opacity-50"
                  >
                    {isModalSubmitting ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
