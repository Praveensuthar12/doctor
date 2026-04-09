"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { PaymentRecord } from "@/lib/types";
import { getWithAuth, putWithAuth } from "@/service/httpService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Mail,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Page = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalPlatformFees, setTotalPlatformFees] = useState<number>(0);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(
    null
  );
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);

  const fetchPayments = async (): Promise<void> => {
    try {
      setLoading(true);

      const response = await getWithAuth("/admin/payments");
      const paymentData: PaymentRecord[] = response?.data || [];

      setPayments(paymentData);

      const total = paymentData.reduce(
        (sum: number, payment: PaymentRecord) =>
          sum + (payment.totalAmount || 0),
        0
      );
      setTotalRevenue(total);

      const platformFees = paymentData.reduce(
        (sum: number, payment: PaymentRecord) =>
          sum + (payment.platformFees || 0),
        0
      );
      setTotalPlatformFees(platformFees);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch payments";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayout = async (
    appointmentId: string,
    payoutStatus: string
  ): Promise<void> => {
    try {
      setProcessingPayment(true);

      if (payoutStatus === "Paid") {
        const response = await putWithAuth(
          `/admin/payments/${appointmentId}/payout`,
          {
            payoutStatus: "Paid",
          }
        );

        toast.success(
          response?.data?.message || "Payout marked as paid successfully"
        );
      } else {
        await putWithAuth(`/admin/payments/${appointmentId}/payout`, {
          payoutStatus: "Cancelled",
        });

        toast.success("Payout cancelled successfully");
      }

      await fetchPayments();
      setShowPayoutModal(false);
      setSelectedPayment(null);
    } catch (error: any) {
      console.error("Error processing payout:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to process payout";
      toast.error(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelPayout = async (): Promise<void> => {
    if (!selectedPayment) return;
    await handleProcessPayout(selectedPayment._id, "Cancelled");
  };

  const openPayoutModal = (payment: PaymentRecord): void => {
    setSelectedPayment(payment);
    setShowPayoutModal(true);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-muted-foreground text-lg">₹</span>
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p>From {payments.length} completed consultation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Consultations
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total completed appointment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Platform Fees
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalPlatformFees)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total platform revenue
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment Record</CardTitle>
          <CardDescription>
            All completed consultation and their payments
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Consulation Fee</th>
                  <th className="text-left py-3 px-4">Platform Fee</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">PayoutStatus</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{payment.doctorName}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {payment.doctorEmail}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {payment.patientName}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-blue-600">
                        {formatCurrency(payment.consultationFees)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-orange-600">
                        {formatCurrency(payment.platformFees)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-green-600">
                        {formatCurrency(payment.totalAmount)}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {payment.payoutStatus === "Paid" ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Paid
                        </Badge>
                      ) : payment.payoutStatus === "Pending" ? (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="bg-red-100 text-red-800"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Cancelled
                        </Badge>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {payment.payoutStatus === "Pending" && (
                        <Button
                          size="sm"
                          onClick={() => openPayoutModal(payment)}
                          className="bg-blue-600 text-white"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Actions
                        </Button>
                      )}

                      {payment.payoutStatus === "Paid" &&
                        payment.payoutDate && (
                          <div className="text-xs text-gray-500">
                            Paid on{" "}
                            {new Date(payment.payoutDate).toLocaleDateString()}
                          </div>
                        )}

                      {payment.payoutStatus === "Cancelled" && (
                        <Badge variant="destructive" className="text-xs">
                          Cancelled
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payments found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showPayoutModal && selectedPayment && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() =>
            !processingPayment &&
            (setShowPayoutModal(false), setSelectedPayment(null))
          }
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Process Payment</h3>

              <button
                onClick={() => {
                  setShowPayoutModal(false), setSelectedPayment(null);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Doctor:</p>
                    <p className="text-sm font-medium">
                      {selectedPayment.doctorName}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Patient:</p>
                    <p className="text-sm font-medium">
                      {selectedPayment.patientName}
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">Consultation Fee:</p>
                    <p className="text-sm font-medium text-blue-600">
                      {formatCurrency(selectedPayment.consultationFees)}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      Payout Details:
                    </p>

                    <div className="space-y-1">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">
                          Doctor will receive:
                        </span>{" "}
                        {formatCurrency(selectedPayment.consultationFees)}
                      </p>

                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Platform keeps:</span>{" "}
                        {formatCurrency(selectedPayment.platformFees)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() =>
                      handleProcessPayout(selectedPayment._id, "Paid")
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    disabled={processingPayment}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>

                  <Button
                    onClick={handleCancelPayout}
                    variant="destructive"
                    className="flex-1"
                    disabled={processingPayment}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Cancel Payout
                  </Button>
                </div>

                {processingPayment && (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
                    <p className="text-sm text-gray-600">
                      Processing payment...
                    </p>
                    <p className="text-xs text-gray-500">
                      Making payout as paid
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
