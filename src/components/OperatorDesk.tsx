"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import * as XLSX from "xlsx";

interface QueueItem {
  id: string;
  tokenId: string;
  farmerName: string;
  centreName: string;
  crop: string;
  weight: number;
  appointmentDate: string;
  appointmentTime: string;
  checkedInAt: string;
  status: string;
}

export default function OperatorDesk() {
  const scannerContainerId = "operator-qr-scanner";
  const scannerContainerRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRunningRef = useRef(false);
  const processingScanRef = useRef(false);
  const scannerSessionRef = useRef(0);
  const [activeTab, setActiveTab] = useState<"scanner" | "manual">("scanner");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [manualForm, setManualForm] = useState({ tokenId: "", farmerName: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastCheckIn, setLastCheckIn] = useState<QueueItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScannerRunning, setIsScannerRunning] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      const response = await fetch("/api/operator/queue");
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to load queue.");
      }
      setQueue(result.queue ?? []);
    } catch (error) {
      console.error("Queue fetch error:", error);
    }
  }, []);

  useEffect(() => {
    // Fetch queue once on mount. Do not poll automatically — keep control in the UI.
    void fetchQueue();
  }, [fetchQueue]);

  const clearScannerContainer = useCallback(() => {
    const container = scannerContainerRef.current ?? document.getElementById(scannerContainerId);
    if (!container) {
      return;
    }

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }, [scannerContainerId]);

  const forceStopMediaInContainer = useCallback((container: Element | null) => {
    try {
      if (!container) return;
      // find any video elements and stop their media tracks
      const videos = Array.from(container.getElementsByTagName("video"));
      videos.forEach((v) => {
        try {
          const stream = (v as HTMLVideoElement).srcObject as MediaStream | null;
          if (stream) {
            stream.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (_) {
                // ignore
              }
            });
            (v as HTMLVideoElement).srcObject = null;
          }
        } catch (e) {
          // ignore errors stopping tracks
        }
        // remove the video element from DOM
        if (v.parentNode) v.parentNode.removeChild(v);
      });
    } catch (e) {
      console.warn("forceStopMediaInContainer error:", e);
    }
  }, []);

  const stopScanner = useCallback(async () => {
    console.debug("stopScanner: entering, session:", scannerSessionRef.current);
    const currentScanner = scannerRef.current;
    // immediately null out ref to prevent re-entrancy
    scannerRef.current = null;
    scannerRunningRef.current = false;
    setIsScannerRunning(false);

    if (currentScanner) {
      try {
        const state = currentScanner.getState();
        console.debug("stopScanner: currentScanner state", state);
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await currentScanner.stop();
          console.debug("stopScanner: currentScanner.stop() awaited");
        }
      } catch (error) {
        console.warn("Scanner stop failed:", error);
      }

      try {
        await currentScanner.clear();
        console.debug("stopScanner: currentScanner.clear() awaited");
      } catch (error) {
        console.warn("Scanner clear failed:", error);
      }
    }

    // Also defensively stop any remaining media tracks in the container
    const container = scannerContainerRef.current ?? document.getElementById(scannerContainerId);
    forceStopMediaInContainer(container);

    clearScannerContainer();
    console.debug("stopScanner: completed, container child count:", container ? container.childElementCount : "no container");
  }, [clearScannerContainer, forceStopMediaInContainer]);

  const startScanner = useCallback(async () => {
    if (processingScanRef.current || scannerRef.current || scannerRunningRef.current) {
      return;
    }

    const container = scannerContainerRef.current ?? document.getElementById(scannerContainerId);
    if (!container) {
      return;
    }

    if (scannerRef.current) {
      // ensure proper cleanup of any existing scanner/session
      console.debug("startScanner: existing scanner found, stopping before new start, session:", scannerSessionRef.current);
      await stopScanner();
    }

    // increment session id and capture it for callbacks
    scannerSessionRef.current += 1;
    const sessionId = scannerSessionRef.current;

    // ensure container is empty and no stray video elements exist
    if (container) {
      console.debug("startScanner: existing container child count before clear:", container.childElementCount);
      forceStopMediaInContainer(container);
      clearScannerContainer();
      console.debug("startScanner: container cleared, child count now:", container.childElementCount);
    }

    const scanner = new Html5Qrcode(scannerContainerId, false);
    scannerRef.current = scanner;

    try {
      // Prefer enumerating cameras and using a deviceId to ensure a camera stream is started.
      // This avoids any library fallback that may expose a file/image picker UI.
      let cameraIdToUse: string | null = null;
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length) {
          // prefer environment/back camera when available
          const env = devices.find((d) => /back|rear|environment|rear/i.test(d.label));
          cameraIdToUse = (env && env.id) || devices[0].id;
        }
      } catch (camErr) {
        // if getCameras fails, leave cameraIdToUse null and allow start to try defaults
        console.warn("Could not enumerate cameras:", camErr);
      }

      const cameraArg = cameraIdToUse ?? { facingMode: "environment" };

      await scanner.start(
        cameraArg,
        {
          fps: 10,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.2,
        },
        async (decodedText) => {
          // synchronous re-entry guard — must be set immediately
          if (processingScanRef.current) return;
          if (sessionId !== scannerSessionRef.current) return;

          // Lock immediately to prevent duplicate processing from multiple callbacks
          processingScanRef.current = true;
          setIsProcessing(true);
          setErrorMessage("");
          setSuccessMessage("");

          const qrToken = decodedText.trim();
          if (!qrToken) {
            processingScanRef.current = false;
            setIsProcessing(false);
            return;
          }

          // Capture current scanner and invalidate the session so further callbacks are ignored
          const currentScanner = scannerRef.current;
          scannerSessionRef.current += 1; // invalidate this session for any outstanding callbacks

          // Stop and clear the scanner instance before making any network requests.
          try {
            if (currentScanner) {
              try {
                const state = currentScanner.getState();
                if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                  await currentScanner.stop();
                }
              } catch (stopErr) {
                console.warn("Scanner stop failed during immediate shutdown:", stopErr);
              }

              try {
                await currentScanner.clear();
              } catch (clearErr) {
                console.warn("Scanner clear failed during immediate shutdown:", clearErr);
              }
            }
          } finally {
            // Ensure refs and DOM are cleaned regardless of stop/clear success
            scannerRef.current = null;
            scannerRunningRef.current = false;
            setIsScannerRunning(false);
            clearScannerContainer();
          }

          // Now perform ONE check-in request only. The server enforces validation/one-time use.
          try {
            const checkInResponse = await fetch("/api/operator/checkin", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ qrToken }),
            });

            const checkInResult = await checkInResponse.json().catch(() => ({}));

            if (!checkInResponse.ok || !checkInResult.success) {
              setErrorMessage(checkInResult.error || "Unable to check in farmer.");
              return;
            }

            setSuccessMessage(`Farmer checked in successfully: ${checkInResult.queueEntry?.tokenId ?? qrToken}`);
            setLastCheckIn(checkInResult.queueEntry ?? {
              id: crypto.randomUUID(),
              tokenId: qrToken,
              farmerName: "Farmer",
              centreName: "Local centre",
              crop: "Paddy",
              weight: 0,
              appointmentDate: "",
              appointmentTime: "",
              checkedInAt: new Date().toISOString(),
              status: "checked_in",
            });

            // Refresh queue exactly once after a successful check-in
            await fetchQueue();
          } catch (error) {
            console.error("QR scan error:", error);
            setErrorMessage("Invalid QR code");
          } finally {
            setIsProcessing(false);
            // release the synchronous processing lock so the operator can start a new session explicitly
            processingScanRef.current = false;
          }
        },
        () => undefined
      );

      scannerRunningRef.current = true;
      setIsScannerRunning(true);
    } catch (error) {
      console.error("Scanner initialization failed:", error);
      setErrorMessage("Unable to access camera. Please allow camera permission and try again.");
      await stopScanner();
    }
  }, [clearScannerContainer, fetchQueue, stopScanner, scannerContainerId]);

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!manualForm.tokenId.trim() || !manualForm.farmerName.trim()) {
      setErrorMessage("Please enter both a valid token ID and farmer name.");
      setSuccessMessage("");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch("/api/operator/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: manualForm.tokenId,
          farmerName: manualForm.farmerName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const normalizedError = result.error || "Manual check-in failed.";
        setErrorMessage(normalizedError === "QR already used" ? "QR already used" : normalizedError === "Invalid QR code" ? "Invalid QR code" : normalizedError);
        return;
      }

      setSuccessMessage("Farmer checked in successfully.");
      setLastCheckIn(result.queueEntry ?? {
        id: crypto.randomUUID(),
        tokenId: manualForm.tokenId,
        farmerName: manualForm.farmerName,
        centreName: "Local centre",
        crop: "Paddy",
        weight: 0,
        appointmentDate: "",
        appointmentTime: "",
        checkedInAt: new Date().toISOString(),
        status: "checked_in",
      });
      setManualForm({ tokenId: "", farmerName: "" });
      await fetchQueue();
    } catch (error) {
      console.error("Manual check-in error:", error);
      setErrorMessage("Invalid QR code");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  useEffect(() => {
    if (activeTab !== "scanner") {
      void stopScanner();
    }
  }, [activeTab, stopScanner]);

  const handleDownloadExcel = () => {
    if (!queue.length) {
      setErrorMessage("No checked-in farmers available to export.");
      return;
    }

    const rows = queue.map((entry) => ({
      "Token ID": entry.tokenId,
      "Farmer Name": entry.farmerName,
      "Procurement Centre": entry.centreName,
      "Crop": entry.crop,
      "Weight": `${entry.weight} Qtl`,
      "Appointment Date": entry.appointmentDate,
      "Appointment Time": entry.appointmentTime,
      "Check-in Time": entry.checkedInAt,
      "Status": entry.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Checked In Farmers");
    XLSX.writeFile(workbook, "checked-in-farmers.xlsx");
  };

  return (
    <section className="py-20 bg-emerald-50/30 border-y border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Operator Desk</h2>
          <div className="h-1.5 w-24 bg-emerald-500 mx-auto my-4 rounded-full"></div>
          <p className="text-slate-600">Scan farmer QR passes or complete a manual check-in for the queue.</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab("scanner")}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                activeTab === "scanner"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              QR Camera Scanner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex-1 px-6 py-4 text-sm font-bold transition-all ${
                activeTab === "manual"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Manual Check-In
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                {successMessage}
              </div>
            )}

            {activeTab === "scanner" ? (
              <div className="grid gap-8 lg:grid-cols-[1.1fr_1.1fr]">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void startScanner()}
                      disabled={isProcessing || isScannerRunning}
                      className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black shadow-md transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isScannerRunning ? "Scanner Running" : "Start Scanner"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void stopScanner()}
                      disabled={isProcessing || !isScannerRunning}
                      className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Stop Scanner
                    </button>
                  </div>

                  <div
                    ref={scannerContainerRef}
                    id={scannerContainerId}
                    className="min-h-[340px] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900"
                  />
                  {isProcessing && (
                    <div className="mt-3 text-sm font-semibold text-slate-600">Requesting camera permission and validating QR pass…</div>
                  )}
                </div>

                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-xl font-black text-slate-900">Scanned Farmer Details</h3>

                  {lastCheckIn ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Token</span>
                        <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">
                          {lastCheckIn.status}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-lg font-black text-slate-900">{lastCheckIn.farmerName}</p>
                        <p><span className="font-bold text-slate-600">Token ID:</span> {lastCheckIn.tokenId}</p>
                        <p><span className="font-bold text-slate-600">Centre:</span> {lastCheckIn.centreName}</p>
                        <p><span className="font-bold text-slate-600">Crop:</span> {lastCheckIn.crop}</p>
                        <p><span className="font-bold text-slate-600">Weight:</span> {lastCheckIn.weight} Qtl</p>
                        <p><span className="font-bold text-slate-600">Date:</span> {lastCheckIn.appointmentDate}</p>
                        <p><span className="font-bold text-slate-600">Time:</span> {lastCheckIn.appointmentTime}</p>
                        <p><span className="font-bold text-slate-600">Check-in:</span> {new Date(lastCheckIn.checkedInAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                      <p className="font-bold text-slate-900 mb-2">Instructions</p>
                      <ul className="space-y-2 list-disc pl-5">
                        <li>Allow camera access when prompted.</li>
                        <li>Position the QR code clearly in the frame.</li>
                        <li>Valid, unused QR codes are accepted once.</li>
                      </ul>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                    <p className="font-bold text-slate-900 mb-2">Check-in result</p>
                    <p className="text-slate-500">QR validation is handled server-side before queue registration.</p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Token ID</label>
                  <input
                    type="text"
                    value={manualForm.tokenId}
                    onChange={(event) => setManualForm((current) => ({ ...current, tokenId: event.target.value }))}
                    placeholder="KS-123456"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Farmer Name</label>
                  <input
                    type="text"
                    value={manualForm.farmerName}
                    onChange={(event) => setManualForm((current) => ({ ...current, farmerName: event.target.value }))}
                    placeholder="Ramesh Kumar"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-black shadow-md transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isProcessing ? "Checking in..." : "Complete Manual Check-In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-100 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Checked-In Queue</h3>
              <p className="text-sm text-slate-500">All successfully checked-in farmers appear here automatically.</p>
            </div>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-600"
            >
              Download Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-bold">Token ID</th>
                  <th className="px-4 py-3 font-bold">Farmer Name</th>
                  <th className="px-4 py-3 font-bold">Procurement Centre</th>
                  <th className="px-4 py-3 font-bold">Crop</th>
                  <th className="px-4 py-3 font-bold">Weight</th>
                  <th className="px-4 py-3 font-bold">Appointment Date</th>
                  <th className="px-4 py-3 font-bold">Appointment Time</th>
                  <th className="px-4 py-3 font-bold">Check-In Time</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {queue.length ? (
                  queue.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-emerald-700">{entry.tokenId}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{entry.farmerName}</td>
                      <td className="px-4 py-3">{entry.centreName}</td>
                      <td className="px-4 py-3">{entry.crop}</td>
                      <td className="px-4 py-3">{entry.weight} Qtl</td>
                      <td className="px-4 py-3">{entry.appointmentDate}</td>
                      <td className="px-4 py-3">{entry.appointmentTime}</td>
                      <td className="px-4 py-3">{new Date(entry.checkedInAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 border border-emerald-100">
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-10 text-center text-slate-500" colSpan={9}>
                      No farmers checked in yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
