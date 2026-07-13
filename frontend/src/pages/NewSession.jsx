import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PatientSearch from "../components/PatientSearch";
import { createSession, uploadAudio } from "../api/endpoints";

export default function NewSession() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const accumulatedRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      accumulatedRef.current = 0;
      startTimeRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      setPaused(false);
      timerRef.current = setInterval(() => {
        if (
          !mediaRecorderRef.current ||
          mediaRecorderRef.current.state === "paused"
        )
          return;
        const secs =
          Math.floor((Date.now() - startTimeRef.current) / 1000) +
          accumulatedRef.current;
        setElapsed(secs);
      }, 500);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      accumulatedRef.current += Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      );
      mediaRecorderRef.current.pause();
      setPaused(true);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      startTimeRef.current = Date.now();
      mediaRecorderRef.current.resume();
      setPaused(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current) return resolve();
      const mr = mediaRecorderRef.current;
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        mr.stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        resolve(blob);
      };
      mr.stop();
    });
  }, []);

  async function handleStartSession() {
    setError("");
    try {
      return await createSession(selectedPatient.id);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to create session");
      return null;
    }
  }

  async function handleConfirmUpload() {
    setShowConfirm(false);
    setUploading(true);
    setError("");
    try {
      const session = await handleStartSession();
      if (!session) {
        setUploading(false);
        return;
      }
      const blob = await stopRecording();
      if (!blob || blob.size === 0) {
        setError("No audio recorded. Please try again.");
        setUploading(false);
        return;
      }
      await uploadAudio(session.id, blob);
      navigate(`/sessions/${session.id}`);
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Upload failed. Please try again.";
      setError(msg);
      setUploading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Recording</h1>
        <p className="text-sm text-muted mt-0.5">
          Record a consultation to generate a SOAP note
        </p>
      </div>

      <div className="card p-5 space-y-4">
        <label className="section-title">Patient</label>
        {selectedPatient ? (
          <div className="flex items-center justify-between p-3 bg-canvas rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-xs font-semibold text-accent">
                {selectedPatient.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">
                {selectedPatient.name}
              </span>
            </div>
            <button
              onClick={() => setSelectedPatient(null)}
              className="btn-ghost text-xs"
            >
              Change
            </button>
          </div>
        ) : (
          <PatientSearch onSelect={setSelectedPatient} />
        )}
      </div>

      <div className="card p-8 flex flex-col items-center space-y-8 animate-slide-up stagger-2">
        <div className="font-mono text-5xl font-medium tracking-tight tabular-nums text-surface-0">
          {formatTime(elapsed)}
        </div>

        {!recording && !uploading && (
          <button
            onClick={startRecording}
            disabled={!selectedPatient}
            className="group relative w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-gray-200 text-white transition-all duration-200 active:scale-95 flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full bg-red-500/20 scale-100 group-hover:scale-110 transition-transform duration-300" />
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="white"
              stroke="none"
              className="relative z-10"
            >
              <circle cx="12" cy="12" r="8" />
            </svg>
          </button>
        )}

        {recording && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 mr-4">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-breathe" />
              <span className="text-xs font-medium text-red-500 uppercase tracking-wider">
                {paused ? "Paused" : "Recording"}
              </span>
            </div>
            {paused ? (
              <button
                onClick={resumeRecording}
                className="btn-primary w-16 h-16 rounded-full p-0"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="none"
                >
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              </button>
            ) : (
              <button
                onClick={pauseRecording}
                className="btn-secondary w-16 h-16 rounded-full p-0"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="none"
                >
                  <rect x="5" y="4" width="5" height="16" rx="1" />
                  <rect x="14" y="4" width="5" height="16" rx="1" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              className="w-16 h-16 rounded-full bg-surface-0 hover:bg-surface-1 text-white transition-all duration-150 active:scale-95 flex items-center justify-center"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="white"
                stroke="none"
              >
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-2 text-accent text-sm font-medium">
            <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Uploading...
          </div>
        )}

        {error && (
          <p className="text-red-500 text-xs text-center animate-slide-up">
            {error}
          </p>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-surface-0/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lift-lg animate-scale-in">
            <h3 className="text-lg font-semibold mb-1">Stop recording?</h3>
            <p className="text-sm text-muted mb-5">
              Duration: {formatTime(elapsed)}. The recording will be uploaded
              and processed for SOAP note generation.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleConfirmUpload} className="btn-primary">
                Confirm & Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
