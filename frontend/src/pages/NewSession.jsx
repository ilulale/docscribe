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
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "paused") return;
        const secs = Math.floor((Date.now() - startTimeRef.current) / 1000) + accumulatedRef.current;
        setElapsed(secs);
      }, 500);
    } catch {
      setError("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      accumulatedRef.current += Math.floor((Date.now() - startTimeRef.current) / 1000);
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
      const session = await createSession(selectedPatient.id);
      return session;
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to create session");
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
      setError(e.response?.data?.detail || "Upload failed. Please try again.");
      setUploading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Recording</h1>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Patient
          </label>
          {selectedPatient ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">{selectedPatient.name}</span>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Change
              </button>
            </div>
          ) : (
            <PatientSearch onSelect={setSelectedPatient} />
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center space-y-6">
          <div className="text-5xl font-mono text-gray-800 tabular-nums">
            {formatTime(elapsed)}
          </div>

          {!recording && !uploading && (
            <button
              onClick={startRecording}
              disabled={!selectedPatient}
              className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-lg font-semibold transition-colors flex items-center justify-center"
            >
              Record
            </button>
          )}

          {recording && (
            <div className="flex gap-4">
              {paused ? (
                <button
                  onClick={resumeRecording}
                  className="w-20 h-20 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold"
                >
                  Resume
                </button>
              ) : (
                <button
                  onClick={pauseRecording}
                  className="w-20 h-20 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                >
                  Pause
                </button>
              )}
              <button
                onClick={() => setShowConfirm(true)}
                className="w-20 h-20 rounded-full bg-gray-700 hover:bg-gray-800 text-white font-semibold"
              >
                Stop
              </button>
            </div>
          )}

          {uploading && (
            <div className="text-blue-600 font-medium">Uploading...</div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Stop Recording?</h3>
            <p className="text-gray-600 mb-4">
              Duration: {formatTime(elapsed)}. The recording will be uploaded and
              processed for SOAP note generation.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm & Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
