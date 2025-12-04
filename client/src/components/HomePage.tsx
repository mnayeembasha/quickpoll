import React, { useState } from "react";
import InterviewBadge from '@/components/InterviewBadge';


const HomePage: React.FC = () => {
  const [role, setRole] = useState<string | null>(null);

  const navigate = () => {
    if (role === "student") window.location.hash = "/student";
    if (role === "teacher") window.location.hash = "/teacher";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl w-full space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <InterviewBadge/>
          <h1 className="text-4xl">
            Welcome to the <span className="text-black font-bold">Live Polling System</span>
          </h1>
          <p className="text-gray-500">
            Please select the role that best describes you to begin using the live polling system
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          {/* Student Card */}
          <div
            onClick={() => setRole("student")}
            className={`cursor-pointer w-full border rounded-xl p-6 space-y-3 transition-all ${
              role === "student"
                ? "border-purple-500   border-3  shadow-md"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <h2 className="text-xl font-semibold">I'm a Student</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry
            </p>
          </div>

          {/* Teacher Card */}
          <div
            onClick={() => setRole("teacher")}
            className={`cursor-pointer w-full border rounded-xl p-6 space-y-3 transition-all ${
              role === "teacher"
                ? "border-purple-500 border-3 shadow-md"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <h2 className="text-xl font-semibold">I'm a Teacher</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Submit answers and view live poll results in real-time.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            disabled={!role}
            onClick={navigate}
            className={`w-48 py-3 rounded-full text-white text-lg font-medium transition-all ${
              role
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-purple-300 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
