"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileSpreadsheet, Loader2, Users, MessageSquare, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { USERS } from "@/lib/users";
import * as XLSX from 'xlsx';

interface ChatSession {
  sessionId: string;
  title: string;
  createdAt: string;
  messages: Array<{
    query: string;
    response: string;
  }>;
}

interface TableRow {
  sessionId: string;
  title: string;
  messageNo: number;
  query: string;
  response: string;
  questionCategory: string;
  responseCategory: string;
  relevant: boolean;
}

export default function DownloadDataPage() {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  // Fetch sessions when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchUserSessions(selectedUser);
    } else {
      setSessions([]);
      setSelectedSession("");
      setTableData([]);
    }
  }, [selectedUser]);

  // Fetch session data when session is selected
  useEffect(() => {
    if (selectedSession) {
      fetchSessionData(selectedSession);
    } else {
      setTableData([]);
    }
  }, [selectedSession]);

  const fetchUserSessions = async (username: string) => {
    setIsLoadingSessions(true);
    setError("");
    try {
      const response = await fetch(`/api/chat/history?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setSessions(data.chatSessions || []);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch sessions");
      setSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchSessionData = async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      const response = await fetch(`/api/chat/${sessionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch session data");
      }
      const { chatSession } = await response.json();
      
      if (chatSession) {
        const rows: TableRow[] = chatSession.messages.map((message: any, index: number) => ({
          sessionId: chatSession.sessionId,
          title: chatSession.title,
          messageNo: index + 1,
          query: message.query,
          response: message.response,
          questionCategory: "",
          responseCategory: "",
          relevant: false,
        }));
        setTableData(rows);
      }
    } catch (error) {
      console.error("Error fetching session data:", error);
      setTableData([]);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const updateRelevant = (index: number, checked: boolean) => {
    setTableData(prev => 
      prev.map((row, i) => 
        i === index ? { ...row, relevant: checked } : row
      )
    );
  };

  const updateQuestionCategory = (index: number, value: string) => {
    setTableData(prev => 
      prev.map((row, i) => 
        i === index ? { ...row, questionCategory: value } : row
      )
    );
  };

  const updateResponseCategory = (index: number, value: string) => {
    setTableData(prev => 
      prev.map((row, i) => 
        i === index ? { ...row, responseCategory: value } : row
      )
    );
  };

  const downloadExcel = async () => {
    if (tableData.length === 0) {
      toast({
        title: "Error",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);

      const exportData = tableData.map(row => ({
        "Session_id": row.sessionId || "",
        "Title": row.title || "",
        "Message_No": row.messageNo || 0,
        "Query": row.query || "",
        "Response": row.response || "",
        "Question_category": row.questionCategory || "Not Selected",
        "Response_category": row.responseCategory || "Not Selected",
        "Relevant": row.relevant ? "Yes" : "No",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Auto-size columns
      const cols = [
        { wch: 20 }, // Session_id
        { wch: 30 }, // Title
        { wch: 12 }, // Message_No
        { wch: 50 }, // Query
        { wch: 80 }, // Response
        { wch: 20 }, // Question_category
        { wch: 20 }, // Response_category
        { wch: 10 }  // Relevant
      ];
      worksheet['!cols'] = cols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Chat Data");

      // Generate filename with fallbacks
      const sessionTitle = tableData[0]?.title || "session";
      const cleanTitle = sessionTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${selectedUser || "user"}_${cleanTitle}.xlsx`;

      XLSX.writeFile(workbook, filename);

      toast({
        title: "Success",
        description: `Excel file "${filename}" downloaded successfully`,
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "Failed to export data to Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Download Chat Data
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Export chat sessions as Excel files for analysis
              </p>
            </div>
          </div>
        </div>

        {/* Selection Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Data to Export
            </CardTitle>
            <CardDescription>
              Choose a user and session to view and export chat data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select User
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {USERS.map((user) => (
                      <SelectItem key={user.username} value={user.username}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Session Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Session
                </label>
                <Select 
                  value={selectedSession} 
                  onValueChange={setSelectedSession}
                  disabled={!selectedUser || isLoadingSessions}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !selectedUser 
                          ? "Select user first..." 
                          : isLoadingSessions 
                          ? "Loading sessions..." 
                          : "Choose a session..."
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.sessionId} value={session.sessionId}>
                        {session.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {selectedSession && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Chat Session Data
                </CardTitle>
                <CardDescription>
                  Review and export the chat data for the selected session
                </CardDescription>
              </div>
              <Button 
                onClick={downloadExcel}
                disabled={tableData.length === 0 || isExporting}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download as Excel
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingSession ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : tableData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Session ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Message No.</TableHead>
                        <TableHead>Query</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead>Question Category</TableHead>
                        <TableHead>Response Category</TableHead>
                        <TableHead>Relevant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">
                            {row.sessionId}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.title}
                          </TableCell>
                          <TableCell className="text-center">
                            {row.messageNo}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={row.query}>
                              {row.query}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate" title={row.response}>
                              {row.response}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={row.questionCategory} 
                              onValueChange={(value) => updateQuestionCategory(index, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="legal">Legal</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                                <SelectItem value="procedural">Procedural</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={row.responseCategory} 
                              onValueChange={(value) => updateResponseCategory(index, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="informative">Informative</SelectItem>
                                <SelectItem value="instructional">Instructional</SelectItem>
                                <SelectItem value="clarification">Clarification</SelectItem>
                                <SelectItem value="referral">Referral</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={row.relevant}
                              onCheckedChange={(checked) => 
                                updateRelevant(index, checked as boolean)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No data available for the selected session
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
