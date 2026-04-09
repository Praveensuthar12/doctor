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
import { UserManagementUser } from "@/lib/types";
import { getWithAuth, putWithAuth } from "@/service/httpService";
import { Calendar, Mail, Search, UserCheck, Users, UserX } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const page = () => {
  const [users, setUsers] = useState<UserManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "patient" | "doctor">(
    "all"
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getWithAuth("/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean
  ) => {
    try {
      await putWithAuth(`/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      });

      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, isActive: !currentStatus } : user
        )
      );

      toast.success(
        `User ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      toast.error("failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || user.type === filterType;

    return matchesSearch && matchesType;
  });

  console.log(users);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Users</CardTitle>
          <CardDescription>Search and filter users by type</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 
           text-gray-400 w-4 h-4 "
                />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
              >
                All Users
              </Button>
              <Button
                variant={filterType === "patient" ? "default" : "outline"}
                onClick={() => setFilterType("patient")}
              >
                Patients
              </Button>
              <Button
                variant={filterType === "doctor" ? "default" : "outline"}
                onClick={() => setFilterType("doctor")}
              >
                Doctors
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Manage user accounts and their status
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Verified</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>

                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        {user.email}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          user.type === "doctor" ? "default" : "secondary"
                        }
                      >
                        {user.type === "doctor" ? "Doctor" : "Patient"}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={user.isActive ? "default" : "destructive"}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    <td className="py-3 px-4">
                      {user.isVerified ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <UserX className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Button
                        variant={user.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() =>
                          handleToggleUserStatus(
                            user._id,
                            user.isActive || false
                          )
                        }
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default page;
