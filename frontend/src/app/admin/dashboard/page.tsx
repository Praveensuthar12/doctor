"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardStats, MonthlyRevenue, ReportData } from "@/lib/types";
import { getWithAuth } from "@/service/httpService";
import { Calendar, ShieldCheck, UserCheck, UserCog, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Pie,
  PieChart,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const page = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getWithAuth("/admin/dashboard"); // ✅ FIX
      setStats(response.data?.stats || null);
      setMonthlyRevenue(response.data?.monthlyRevenue || []);
      setReportData({
        userGrowth: response.data?.userGrowth || [],
        appointmentStats: response.data?.appointmentStats || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data", error);
      setStats(null);
      setMonthlyRevenue([]);
      setReportData({
        userGrowth: [],
        appointmentStats: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formateRevenueData = (data: MonthlyRevenue[]) => {
    return data.map((item) => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleDateString(
        "en-US",
        { month: "short" }
      ),
      revenue: item.revenue,
    }));
  };

  const formatAppointmentStats = (data: any[]) => {
    return data.map((item) => ({
      name: item._id,
      value: item.count,
    }));
  };

  const formatUserGrowth = (data: any[]) => {
    return data.map((item) => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleDateString(
        "en-US",
        { month: "short" }
      ),
      patients: item.patients,
      doctors: item.doctors,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold ">
              {stats?.totalPatients || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold ">
              {stats?.totalDoctors || 0}
            </div>
            <p className="text-xs text-muted-foreground">Registered doctors</p>
          </CardContent>
        </Card>

        <Card className={stats?.pendingDoctors > 0 ? "border-amber-400" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <ShieldCheck className={`h-4 w-4 ${stats?.pendingDoctors > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats?.pendingDoctors > 0 ? "text-amber-600" : ""}`}>
              {stats?.pendingDoctors || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingDoctors > 0 ? (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-amber-600" 
                  onClick={() => router.push("/admin/verifications")}
                >
                  Review now
                </Button>
              ) : (
                "No pending verifications"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold ">
              {stats?.totalAppointments || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedAppointments || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-muted-foreground text-lg">₹</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold ">
              {stats?.totalRevenue || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              From completed consultations
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>
              Revenue from completed consultations over the past six months
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formateRevenueData(monthlyRevenue)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
            <CardDescription>
              Distribution of appointment statuses
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatAppointmentStats(
                      reportData?.appointmentStats || []
                    )}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatAppointmentStats(
                      reportData?.appointmentStats || []
                    ).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className=" grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              New user registrations over the past six months
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatUserGrowth(reportData?.userGrowth || [])}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="patients" fill="#8884d8" name="Patients" />
                  <Bar dataKey="doctors" fill="#82ca9d" name="Doctors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>

          <CardContent className="space-y-2" >
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push("/admin/verifications")}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Verify Doctors
            </Button>

            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push("/admin/users")}
            >
              <UserCog />
              Manage Users
            </Button>

            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => router.push("/admin/payments")}
            >
              <UserCog className="h-4 w-4 mr-2" />
              Process Payments
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default page;
