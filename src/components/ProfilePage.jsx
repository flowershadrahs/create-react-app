import React, { useContext } from "react";
import { User, Mail, Lock, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { DataContext } from "../DataContext";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { user, loading, error } = useContext(DataContext);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Successfully signed out");
    } catch (error) {
      toast.error("Failed to sign out: " + error.message);
    }
  };

  // Show loading if data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 max-w-md w-full">
          <div className="animate-pulse">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-300 mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-48"></div>
            </div>
            <div className="space-y-4">
              <div className="h-16 bg-gray-300 rounded-lg"></div>
              <div className="h-16 bg-gray-300 rounded-lg"></div>
              <div className="h-12 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if data fetching failed
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center gap-2 max-w-md w-full">
          {error}
        </div>
      </div>
    );
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 max-w-md w-full text-center">
          <p className="text-neutral-600 text-lg">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold text-neutral-800 mb-6 text-center">Profile</h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-800">{user.email}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50/50">
            <Mail className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-sm text-neutral-600">Email</p>
              <p className="font-medium text-neutral-800">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50/50">
            <Lock className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-sm text-neutral-600">Password</p>
              <p className="font-medium text-neutral-800">••••••••</p>
            </div>
          </div>

          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;