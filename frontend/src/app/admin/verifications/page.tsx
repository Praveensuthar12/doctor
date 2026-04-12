"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Doctor } from "@/lib/types";
import { getWithAuth, putWithAuth } from "@/service/httpService";
import { 
  AlertCircle, 
  BadgeCheck, 
  CheckCircle, 
  Eye, 
  FileText, 
  Mail, 
  Search, 
  XCircle 
} from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface PendingDoctor extends Doctor {
  licenseNumber?: string;
  rejectionReason?: string;
}

const VerificationsPage = () => {
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<PendingDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"pending" | "verified" | "all">("pending");
  const [selectedDoctor, setSelectedDoctor] = useState<PendingDoctor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [filter]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      if (filter === "pending") {
        const response = await getWithAuth("/admin/doctors/pending");
        setPendingDoctors(response.data);
        setAllDoctors(response.data);
      } else if (filter === "verified") {
        const response = await getWithAuth("/admin/doctors?isVerified=true");
        setAllDoctors(response.data);
      } else {
        const response = await getWithAuth("/admin/doctors");
        setAllDoctors(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch doctors");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId: string) => {
    try {
      await putWithAuth(`/admin/doctors/${doctorId}/verify`, {
        isVerified: true,
      });

      toast.success("Doctor verified successfully");
      setAllDoctors(allDoctors.filter(d => d._id !== doctorId));
      setPendingDoctors(pendingDoctors.filter(d => d._id !== doctorId));
    } catch (error) {
      toast.error("Failed to verify doctor");
    }
  };

  const handleRejectDoctor = async () => {
    if (!selectedDoctor) return;
    
    try {
      await putWithAuth(`/admin/doctors/${selectedDoctor._id}/verify`, {
        isVerified: false,
        rejectionReason: rejectionReason || "Verification rejected by admin",
      });

      toast.success("Doctor verification rejected");
      setAllDoctors(allDoctors.filter(d => d._id !== selectedDoctor._id));
      setPendingDoctors(pendingDoctors.filter(d => d._id !== selectedDoctor._id));
      setShowRejectModal(false);
      setSelectedDoctor(null);
      setRejectionReason("");
    } catch (error) {
      toast.error("Failed to reject doctor");
    }
  };

  const filteredDoctors = allDoctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const pendingCount = pendingDoctors.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Verifications</h1>
          <p className="text-gray-600">Manage doctor license verification requests</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {pendingCount} Pending {pendingCount === 1 ? "Request" : "Requests"}
          </Badge>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Doctors</CardTitle>
          <CardDescription>Search and filter doctors by verification status</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 
                  text-gray-400 w-4 h-4 "
                />
                <Input
                  placeholder="Search by name, email, license number, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => setFilter("pending")}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Pending
              </Button>
              <Button
                variant={filter === "verified" ? "default" : "outline"}
                onClick={() => setFilter("verified")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Verified
              </Button>
              <Button
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => setFilter("all")}
              >
                All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filter === "pending" && pendingCount === 0 && (
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              All Caught Up!
            </h3>
            <p className="text-gray-600">
              No pending doctor verification requests at the moment.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {filter === "pending" ? "Pending Verifications" : filter === "verified" ? "Verified Doctors" : "All Doctors"} ({filteredDoctors.length})
          </CardTitle>
          <CardDescription>
            {filter === "pending" 
              ? "Review and verify doctor license information"
              : "View doctor verification status"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">License Number</th>
                  <th className="text-left py-3 px-4">Specialization</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          {doctor.profileImage ? (
                            <img 
                              src={doctor.profileImage} 
                              alt={doctor.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-semibold">
                              {doctor.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{doctor.name}</div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Mail className="h-3 w-3 mr-1" />
                            {doctor.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-mono font-medium">
                          {doctor.licenseNumber || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {doctor.specialization || "Not specified"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {doctor.isVerified ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(doctor.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {filter === "pending" && !doctor.isVerified ? (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleVerifyDoctor(doctor._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowRejectModal(true);
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDoctor(doctor)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredDoctors.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No doctors found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showRejectModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Reject Doctor Verification</CardTitle>
              <CardDescription>
                Please provide a reason for rejecting {selectedDoctor.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason (Optional)
                  </label>
                  <Input
                    placeholder="e.g., Invalid license number"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedDoctor(null);
                      setRejectionReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectDoctor}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedDoctor && !showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Doctor Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDoctor(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    {selectedDoctor.profileImage ? (
                      <img 
                        src={selectedDoctor.profileImage} 
                        alt={selectedDoctor.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-blue-600 text-2xl font-semibold">
                        {selectedDoctor.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedDoctor.name}</h3>
                    <p className="text-gray-600 flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {selectedDoctor.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">License Number</label>
                    <p className="font-mono font-medium">{selectedDoctor.licenseNumber || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Specialization</label>
                    <p className="font-medium">{selectedDoctor.specialization || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Qualification</label>
                    <p className="font-medium">{selectedDoctor.qualification || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Experience</label>
                    <p className="font-medium">{selectedDoctor.experience || 0} years</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Status</label>
                    <p>
                      {selectedDoctor.isVerified ? (
                        <Badge className="bg-green-100 text-green-800">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Joined</label>
                    <p>{new Date(selectedDoctor.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedDoctor.hospitalInfo?.name && (
                  <div>
                    <label className="text-sm text-gray-500">Hospital</label>
                    <p className="font-medium">{selectedDoctor.hospitalInfo.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedDoctor.hospitalInfo.address}, {selectedDoctor.hospitalInfo.city}
                    </p>
                  </div>
                )}

                {selectedDoctor.about && (
                  <div>
                    <label className="text-sm text-gray-500">About</label>
                    <p className="text-gray-700">{selectedDoctor.about}</p>
                  </div>
                )}

                {selectedDoctor.rejectionReason && (
                  <div className="bg-red-50 p-3 rounded-md">
                    <label className="text-sm text-red-700 font-medium">Rejection Reason</label>
                    <p className="text-red-600">{selectedDoctor.rejectionReason}</p>
                  </div>
                )}

                {!selectedDoctor.isVerified && (
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleVerifyDoctor(selectedDoctor._id);
                        setSelectedDoctor(null);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Verification
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setShowRejectModal(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VerificationsPage;
