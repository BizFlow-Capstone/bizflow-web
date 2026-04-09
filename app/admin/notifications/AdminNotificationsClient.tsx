"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FileText,
  Megaphone,
  AlertTriangle,
  Plus,
  Send,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Zap,
  Activity,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  NotificationTemplate,
  NotificationDispatch,
  NotificationActionCatalog,
  CreateDispatchRequest,
  PaginatedResponse,
} from "@/lib/types/adminNotification";
import {
  getTemplates,
  getTemplateByEventCode,
  getActionCatalog,
  upsertTemplate,
  toggleTemplate,
  createDispatch,
  getDispatches,
  processDueDispatches,
} from "@/lib/admin-notification-api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
}

function statusConfig(status: string) {
  switch (status) {
    case "SENT":
    case "COMPLETED":
      return {
        label: "Đã gửi",
        variant: "secondary" as const,
        className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
        icon: CheckCircle2,
      };
    case "PENDING":
    case "PROCESSING":
      return {
        label: "Chờ gửi",
        variant: "secondary" as const,
        className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
        icon: Clock,
      };
    default:
      return {
        label: "Thất bại",
        variant: "destructive" as const,
        className: "bg-red-50 text-red-700 hover:bg-red-50",
        icon: XCircle,
      };
  }
}

function normalizeActionType(value?: string | null) {
  const normalized = (value ?? "").trim().toUpperCase();
  return normalized === "NAVIGATE_TO_SCREEN" ? "NAVIGATE" : normalized;
}

function isNavigateAction(value?: string | null) {
  return normalizeActionType(value) === "NAVIGATE";
}

function findTargetByScreenOrAlias(
  actionCatalog: NotificationActionCatalog | null,
  value?: string | null,
) {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized || !actionCatalog) return undefined;
  return actionCatalog.targets.find(
    (target) =>
      target.targetScreen.toLowerCase() === normalized ||
      target.aliases.some((alias) => alias.toLowerCase() === normalized),
  );
}

function buildRoutePayloadFromTarget(
  target?: NotificationActionCatalog["targets"][number],
) {
  if (!target) return "";
  if (target.payloadExampleJson?.trim()) return target.payloadExampleJson;
  const preferredRoute = target.webRoute?.trim() || target.mobileRoute?.trim();
  if (!preferredRoute) return "";
  return JSON.stringify({ route: preferredRoute });
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const emptyTemplateForm = {
  notificationType: "",
  titleTemplate: "",
  contentTemplate: "",
  defaultActionType: "",
  defaultTargetScreen: "",
  defaultActionPayloadJson: "",
  isActive: true,
};

const emptyCampaignForm: CreateDispatchRequest = {
  eventCode: "",
  notificationType: "PROMOTION",
  priority: "NORMAL",
  title: "",
  content: "",
  actionType: "",
  targetScreen: "",
  actionPayloadJson: "",
  sendToAllUsers: true,
  scheduledAt: "",
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminNotificationsClient() {
  // ── Data ──
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [catalog, setCatalog] = useState<NotificationActionCatalog | null>(
    null,
  );
  const [dispatches, setDispatches] =
    useState<PaginatedResponse<NotificationDispatch> | null>(null);
  const [failedDispatches, setFailedDispatches] =
    useState<PaginatedResponse<NotificationDispatch> | null>(null);

  // ── Template editing ──
  const [selectedTemplate, setSelectedTemplate] =
    useState<NotificationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [newEventCode, setNewEventCode] = useState("");
  const [activeTemplateField, setActiveTemplateField] = useState<
    "title" | "content"
  >("content");
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // ── Campaign form ──
  const [campaignForm, setCampaignForm] = useState(emptyCampaignForm);

  // ── UI ──
  const [searchTemplate, setSearchTemplate] = useState("");
  const [activeTab, setActiveTab] = useState("templates");
  const [loading, setLoading] = useState(false);
  const [loadingTemplateDetail, setLoadingTemplateDetail] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"ok" | "error">("ok");

  // ── Computed ──────────────────────────────────────────────────────────────────

  const filteredTemplates = useMemo(
    () =>
      templates.filter(
        (t) =>
          t.eventCode.toLowerCase().includes(searchTemplate.toLowerCase()) ||
          t.titleTemplate.toLowerCase().includes(searchTemplate.toLowerCase()),
      ),
    [templates, searchTemplate],
  );

  const selectedTarget = useMemo(() => {
    return findTargetByScreenOrAlias(catalog, templateForm.defaultTargetScreen);
  }, [catalog, templateForm.defaultTargetScreen]);

  const selectedCampaignTarget = useMemo(() => {
    return findTargetByScreenOrAlias(catalog, campaignForm.targetScreen);
  }, [campaignForm.targetScreen, catalog]);

  // ── Load helpers ──────────────────────────────────────────────────────────────

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      const data = await getActionCatalog();
      setCatalog(data);
    } catch {
      setCatalog(null);
    }
  }, []);

  const loadDispatches = useCallback(async () => {
    try {
      const data = await getDispatches(1, 20);
      setDispatches(data);
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    }
  }, []);

  const loadFailedDispatches = useCallback(async () => {
    try {
      const data = await getDispatches(1, 50, "FAILED");
      setFailedDispatches(data);
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    }
  }, []);

  // ── Bootstrap ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    void loadTemplates();
    void loadCatalog();
    void loadDispatches();
    void loadFailedDispatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync template form when selection changes
  useEffect(() => {
    if (!selectedTemplate) return;
    setTemplateForm({
      notificationType: selectedTemplate.notificationType ?? "",
      titleTemplate: selectedTemplate.titleTemplate ?? "",
      contentTemplate: selectedTemplate.contentTemplate ?? "",
      defaultActionType: normalizeActionType(
        selectedTemplate.defaultActionType,
      ),
      defaultTargetScreen: selectedTemplate.defaultTargetScreen ?? "",
      defaultActionPayloadJson: selectedTemplate.defaultActionPayloadJson ?? "",
      isActive: selectedTemplate.isActive,
    });
  }, [selectedTemplate]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function onSaveTemplate(event: FormEvent) {
    event.preventDefault();
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      setMessage("");
      await upsertTemplate(selectedTemplate.eventCode, templateForm);
      setMessage(`Đã lưu template "${selectedTemplate.eventCode}" thành công.`);
      setMessageType("ok");
      await loadTemplates();
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function onToggleTemplate() {
    if (!selectedTemplate) return;
    try {
      setLoading(true);
      setMessage("");
      await toggleTemplate(
        selectedTemplate.eventCode,
        !selectedTemplate.isActive,
      );
      await loadTemplates();
      setMessage(
        `Đã ${!selectedTemplate.isActive ? "bật" : "tắt"} template "${selectedTemplate.eventCode}".`,
      );
      setMessageType("ok");
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateNewTemplate() {
    const code = newEventCode.trim().toUpperCase();
    if (!code) {
      setMessage("Nhập Event Code trước khi tạo template mới.");
      setMessageType("error");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      await upsertTemplate(code, {
        notificationType: code,
        titleTemplate: `Thông báo ${code}`,
        contentTemplate: `Nội dung thông báo cho sự kiện ${code}`,
        defaultActionType: "",
        defaultTargetScreen: "",
        defaultActionPayloadJson: "",
        isActive: true,
      });
      setNewEventCode("");
      await loadTemplates();
      setMessage(`Đã tạo template mới: ${code}`);
      setMessageType("ok");
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function onSelectTemplate(template: NotificationTemplate) {
    setSelectedTemplate(template);
    try {
      setLoadingTemplateDetail(true);
      const detail = await getTemplateByEventCode(template.eventCode);
      setSelectedTemplate(detail);
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    } finally {
      setLoadingTemplateDetail(false);
    }
  }

  async function onCampaignTemplateChange(value: string) {
    const eventCode = value === "__none__" ? "" : value;
    setCampaignForm((prev) => ({ ...prev, eventCode }));

    if (!eventCode) {
      return;
    }

    try {
      let activeCatalog = catalog;
      if (!activeCatalog) {
        activeCatalog = await getActionCatalog();
        setCatalog(activeCatalog);
      }

      const detail = await getTemplateByEventCode(eventCode);
      const normalizedActionType = normalizeActionType(
        detail.defaultActionType,
      );
      const resolvedTarget = findTargetByScreenOrAlias(
        activeCatalog,
        detail.defaultTargetScreen,
      );
      const resolvedTargetScreen =
        resolvedTarget?.targetScreen ?? detail.defaultTargetScreen ?? "";
      const shouldMapRoute = normalizedActionType === "NAVIGATE";
      const resolvedPayload = shouldMapRoute
        ? detail.defaultActionPayloadJson?.trim() ||
          buildRoutePayloadFromTarget(resolvedTarget)
        : "";

      setCampaignForm((prev) => ({
        ...prev,
        eventCode,
        notificationType: detail.notificationType || prev.notificationType,
        title: detail.titleTemplate || prev.title,
        content: detail.contentTemplate || prev.content,
        actionType: normalizedActionType,
        targetScreen: shouldMapRoute ? resolvedTargetScreen : "",
        actionPayloadJson: resolvedPayload,
      }));
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    }
  }

  async function onCreateCampaign(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      const normalizedActionType = normalizeActionType(campaignForm.actionType);
      const payload: CreateDispatchRequest = {
        ...campaignForm,
        eventCode: campaignForm.eventCode?.trim() || undefined,
        notificationType: campaignForm.notificationType?.trim() || undefined,
        priority: campaignForm.priority?.trim() || undefined,
        title: campaignForm.title?.trim() || undefined,
        content: campaignForm.content?.trim() || undefined,
        actionType: normalizedActionType || undefined,
        targetScreen: campaignForm.targetScreen?.trim() || undefined,
        actionPayloadJson: campaignForm.actionPayloadJson?.trim() || undefined,
        scheduledAt: campaignForm.scheduledAt?.trim() || undefined,
      };
      if (!payload.actionType) {
        payload.targetScreen = undefined;
        payload.actionPayloadJson = undefined;
      }
      await createDispatch(payload);
      setMessage("Đã tạo chiến dịch thành công.");
      setMessageType("ok");
      setCampaignForm(emptyCampaignForm);
      await loadDispatches();
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  async function onProcessDue() {
    try {
      setLoading(true);
      setMessage("");
      await processDueDispatches();
      setMessage("Đã trigger process-due dispatches thành công.");
      setMessageType("ok");
      await loadFailedDispatches();
      await loadDispatches();
    } catch (err) {
      setMessage((err as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  function insertTokenToField(token: string) {
    const isTitle = activeTemplateField === "title";
    const targetElement = isTitle
      ? titleInputRef.current
      : contentTextareaRef.current;

    if (!targetElement) {
      setTemplateForm((prev) => ({
        ...prev,
        [isTitle ? "titleTemplate" : "contentTemplate"]:
          `${isTitle ? prev.titleTemplate : prev.contentTemplate}${token}`,
      }));
      return;
    }

    const cursorStart =
      targetElement.selectionStart ?? targetElement.value.length;
    const cursorEnd = targetElement.selectionEnd ?? targetElement.value.length;

    setTemplateForm((prev) => {
      const currentValue = isTitle ? prev.titleTemplate : prev.contentTemplate;
      const nextValue = `${currentValue.slice(0, cursorStart)}${token}${currentValue.slice(cursorEnd)}`;
      return {
        ...prev,
        [isTitle ? "titleTemplate" : "contentTemplate"]: nextValue,
      };
    });

    setTimeout(() => {
      const nextPos = cursorStart + token.length;
      targetElement.focus();
      targetElement.setSelectionRange(nextPos, nextPos);
    }, 0);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  const dispatchItems = dispatches?.items ?? [];
  const failedItems = failedDispatches?.items ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Thông Báo</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý mẫu template, tạo chiến dịch gửi thông báo và theo dõi nhật ký.
        </p>
      </div> */}

      {/* Alert message */}
      {message && (
        <div
          className={`text-sm px-4 py-2.5 rounded-lg border ${
            messageType === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Quick stats */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Templates",
            value: templates.length,
            sub: `${templates.filter((t) => t.isActive).length} đang bật`,
            color: "text-blue-600",
          },
          {
            label: "Chiến dịch",
            value: dispatches?.totalCount ?? 0,
            sub: "tổng cộng",
            color: "text-violet-600",
          },
          {
            label: "Đã gửi",
            value: dispatchItems.filter((d) => d.status === "SENT").length,
            sub: "trong trang này",
            color: "text-emerald-600",
          },
          {
            label: "Thất bại",
            value: failedDispatches?.totalCount ?? 0,
            sub: "cần xử lý",
            color: "text-red-600",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div> */}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="templates" className="gap-1.5">
            <FileText className="w-4 h-4" />
            Mẫu Thông Báo
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Megaphone className="w-4 h-4" />
            Chiến Dịch
          </TabsTrigger>
          <TabsTrigger value="delivery-logs" className="gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Nhật Ký Gửi
          </TabsTrigger>
          <TabsTrigger value="hangfire" className="gap-1.5">
            <Activity className="w-4 h-4" />
            Hiệu Suất
          </TabsTrigger>
        </TabsList>

        {/* ── Templates ── */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm template..."
                className="pl-9"
                value={searchTemplate}
                onChange={(e) => setSearchTemplate(e.target.value)}
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              disabled={loading}
              onClick={loadTemplates}
              title="Làm mới"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* List */}
            <Card className="lg:col-span-1 border-0 shadow-sm">
              <CardHeader className="">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Danh Sách ({filteredTemplates.length})
                </CardTitle>
              </CardHeader>
              <div className="flex items-center gap-2 justify-between">
                <Input
                  placeholder="NEW_EVENT_CODE"
                  className="ml-6"
                  value={newEventCode}
                  onChange={(e) => setNewEventCode(e.target.value)}
                />
                <Button
                  variant="outline"
                  className="gap-1.5 mr-6"
                  disabled={loading}
                  onClick={onCreateNewTemplate}
                >
                  <Plus className="w-4 h-4" />
                  Tạo Mới
                </Button>
              </div>
              <CardContent className="space-y-1 max-h-[520px] overflow-y-auto">
                {loading && templates.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Đang tải...
                  </p>
                )}
                {filteredTemplates.map((tpl) => (
                  <button
                    key={tpl.eventCode}
                    onClick={() => void onSelectTemplate(tpl)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedTemplate?.eventCode === tpl.eventCode
                        ? "bg-teal-50 border border-teal-200 shadow-sm"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate">
                        {tpl.eventCode}
                      </span>
                      {tpl.isActive ? (
                        <ToggleRight className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-gray-300 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tpl.notificationType}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Editor */}
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Chi Tiết Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedTemplate ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <FileText className="w-10 h-10 mb-3" />
                    <p className="text-sm">
                      Chọn template bên trái để xem / chỉnh sửa
                    </p>
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={onSaveTemplate}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-gray-800">
                          {selectedTemplate.eventCode}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Cập nhật:{" "}
                          {formatDate(
                            selectedTemplate.updatedAt ??
                              selectedTemplate.createdAt,
                          )}
                        </p>
                        {loadingTemplateDetail && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Đang tải chi tiết template...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="tpl-active"
                          className="text-sm text-gray-500"
                        >
                          {templateForm.isActive ? "Đang bật" : "Đã tắt"}
                        </Label>
                        <Switch
                          id="tpl-active"
                          checked={templateForm.isActive}
                          onCheckedChange={(checked) =>
                            setTemplateForm((prev) => ({
                              ...prev,
                              isActive: checked,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">
                          Notification Type
                        </Label>
                        <Input
                          value={templateForm.notificationType}
                          onChange={(e) =>
                            setTemplateForm((prev) => ({
                              ...prev,
                              notificationType: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">
                          Default Action Type
                        </Label>
                        <Select
                          value={templateForm.defaultActionType || "__none__"}
                          onValueChange={(val) => {
                            const actualVal = val === "__none__" ? "" : val;
                            const nextActionType =
                              normalizeActionType(actualVal);
                            const canNavigate =
                              isNavigateAction(nextActionType);
                            setTemplateForm((prev) => ({
                              ...prev,
                              defaultActionType: nextActionType,
                              defaultTargetScreen: canNavigate
                                ? prev.defaultTargetScreen
                                : "",
                              defaultActionPayloadJson: canNavigate
                                ? prev.defaultActionPayloadJson
                                : "",
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="(none)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">(none)</SelectItem>
                            {(catalog?.actionTypes ?? [])
                              .filter((a) => a.code !== "NAVIGATE_TO_SCREEN")
                              .map((a) => (
                                <SelectItem key={a.code} value={a.code}>
                                  {a.code} – {a.displayName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">
                        Title Template
                      </Label>
                      <Input
                        ref={titleInputRef}
                        value={templateForm.titleTemplate}
                        onFocus={() => setActiveTemplateField("title")}
                        onChange={(e) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            titleTemplate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">
                        Content Template
                      </Label>
                      <Textarea
                        ref={contentTextareaRef}
                        value={templateForm.contentTemplate}
                        rows={3}
                        onFocus={() => setActiveTemplateField("content")}
                        onChange={(e) =>
                          setTemplateForm((prev) => ({
                            ...prev,
                            contentTemplate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    {/* Placeholder chips */}
                    {catalog?.placeholders &&
                      catalog.placeholders.length > 0 && (
                        <div className="rounded-lg border border-gray-100 p-3 bg-gray-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-600">
                              Template Placeholders
                            </p>
                            <span className="text-xs text-gray-400">
                              Chèn vào:{" "}
                              {activeTemplateField === "title"
                                ? "Title"
                                : "Content"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {catalog.placeholders.map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                title={`${item.description} (VD: ${item.exampleValue})`}
                                onClick={() => insertTokenToField(item.token)}
                                className="inline-flex items-center px-2 py-1 rounded-md bg-white border border-gray-200 text-xs font-mono text-teal-700 hover:border-teal-300 hover:bg-teal-50 transition-colors"
                              >
                                {item.token}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">
                          Target Screen
                        </Label>
                        <Select
                          value={templateForm.defaultTargetScreen || "__none__"}
                          onValueChange={(val) => {
                            const actualVal = val === "__none__" ? "" : val;
                            const target = catalog?.targets.find(
                              (t) => t.targetScreen === actualVal,
                            );
                            setTemplateForm((prev) => ({
                              ...prev,
                              defaultActionType: actualVal
                                ? "NAVIGATE"
                                : isNavigateAction(prev.defaultActionType)
                                  ? ""
                                  : normalizeActionType(prev.defaultActionType),
                              defaultTargetScreen: actualVal,
                              defaultActionPayloadJson:
                                actualVal === ""
                                  ? ""
                                  : prev.defaultActionPayloadJson.trim()
                                        .length > 0
                                    ? prev.defaultActionPayloadJson
                                    : (target?.payloadExampleJson ?? ""),
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="(none)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">(none)</SelectItem>
                            {(catalog?.targets ?? []).map((t) => (
                              <SelectItem key={t.code} value={t.targetScreen}>
                                {t.targetScreen}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-500">
                          Action Payload JSON
                        </Label>
                        <Input
                          value={templateForm.defaultActionPayloadJson}
                          className="font-mono text-xs"
                          onChange={(e) =>
                            setTemplateForm((prev) => ({
                              ...prev,
                              defaultActionPayloadJson: e.target.value,
                            }))
                          }
                        />
                        {selectedTarget && (
                          <button
                            type="button"
                            className="text-[11px] text-teal-600 hover:underline"
                            onClick={() =>
                              setTemplateForm((prev) => ({
                                ...prev,
                                defaultActionPayloadJson:
                                  selectedTarget.payloadExampleJson,
                              }))
                            }
                          >
                            Dùng payload mẫu ↑
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        className="bg-teal-600 hover:bg-teal-700"
                        disabled={loading}
                      >
                        {loading && (
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        )}
                        Lưu Template
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={
                          selectedTemplate.isActive
                            ? "text-red-600 border-red-200 hover:bg-red-50"
                            : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        }
                        disabled={loading}
                        onClick={onToggleTemplate}
                      >
                        {selectedTemplate.isActive
                          ? "Tắt Template"
                          : "Bật Template"}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Auto-trigger info */}
          {catalog?.triggers && catalog.triggers.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Auto Trigger Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 mb-3">
                  Các event dưới đây được hệ thống tự bắn từ chức năng nghiệp
                  vụ. Chỉ cần tạo template đúng Event Code là tự chạy.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {catalog.triggers.map((trigger) => (
                    <div
                      key={trigger.eventCode}
                      className="rounded-lg border border-gray-100 p-2.5 bg-gray-50"
                    >
                      <p className="text-xs font-mono font-semibold text-teal-700">
                        {trigger.eventCode}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {trigger.feature}: {trigger.triggerDescription}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Campaigns ── */}
        <TabsContent value="campaigns" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Tạo Chiến Dịch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={onCreateCampaign}>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Template (tuỳ chọn)
                    </Label>
                    <Select
                      value={campaignForm.eventCode || "__none__"}
                      onValueChange={(val) =>
                        void onCampaignTemplateChange(val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          (không dùng template)
                        </SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.eventCode} value={t.eventCode}>
                            {t.eventCode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Loại</Label>
                      <Select
                        value={campaignForm.notificationType}
                        onValueChange={(val) =>
                          setCampaignForm((prev) => ({
                            ...prev,
                            notificationType: val,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROMOTION">PROMOTION</SelectItem>
                          <SelectItem value="SYSTEM">SYSTEM</SelectItem>
                          <SelectItem value="SYSTEM_ALERT">
                            SYSTEM_ALERT
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Ưu tiên</Label>
                      <Select
                        value={campaignForm.priority}
                        onValueChange={(val) =>
                          setCampaignForm((prev) => ({
                            ...prev,
                            priority: val,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NORMAL">NORMAL</SelectItem>
                          <SelectItem value="HIGH">HIGH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Tiêu đề</Label>
                    <Input
                      placeholder="Nhập tiêu đề thông báo..."
                      value={campaignForm.title}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Nội dung</Label>
                    <Textarea
                      placeholder="Nhập nội dung..."
                      rows={3}
                      value={campaignForm.content}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Lịch gửi (tuỳ chọn)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={campaignForm.scheduledAt}
                      onChange={(e) =>
                        setCampaignForm((prev) => ({
                          ...prev,
                          scheduledAt: e.target.value,
                        }))
                      }
                    />
                    <p className="text-[11px] text-gray-400">
                      Bỏ trống để gửi ngay lập tức
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">
                        Action Type
                      </Label>
                      <Select
                        value={campaignForm.actionType || "__none__"}
                        onValueChange={(val) => {
                          const actualVal = val === "__none__" ? "" : val;
                          const nextActionType = normalizeActionType(actualVal);
                          const canNavigate = isNavigateAction(nextActionType);
                          setCampaignForm((prev) => ({
                            ...prev,
                            actionType: nextActionType,
                            targetScreen: canNavigate ? prev.targetScreen : "",
                            actionPayloadJson: canNavigate
                              ? prev.actionPayloadJson
                              : "",
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="(none)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">(none)</SelectItem>
                          {(catalog?.actionTypes ?? [])
                            .filter((a) => a.code !== "NAVIGATE_TO_SCREEN")
                            .map((a) => (
                              <SelectItem key={a.code} value={a.code}>
                                {a.code} - {a.displayName}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">
                        Target Screen
                      </Label>
                      <Select
                        value={campaignForm.targetScreen || "__none__"}
                        onValueChange={(val) => {
                          const actualVal = val === "__none__" ? "" : val;
                          const target = catalog?.targets.find(
                            (t) => t.targetScreen === actualVal,
                          );
                          setCampaignForm((prev) => ({
                            ...prev,
                            actionType: actualVal
                              ? "NAVIGATE"
                              : isNavigateAction(prev.actionType)
                                ? ""
                                : normalizeActionType(prev.actionType),
                            targetScreen: actualVal,
                            actionPayloadJson:
                              actualVal === ""
                                ? ""
                                : prev.actionPayloadJson?.trim().length
                                  ? prev.actionPayloadJson
                                  : (target?.payloadExampleJson ?? ""),
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="(none)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">(none)</SelectItem>
                          {(catalog?.targets ?? []).map((t) => (
                            <SelectItem key={t.code} value={t.targetScreen}>
                              {t.targetScreen}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Action Payload JSON
                    </Label>
                    <Input
                      value={campaignForm.actionPayloadJson ?? ""}
                      className="font-mono text-xs"
                      onChange={(e) =>
                        setCampaignForm((prev) => ({
                          ...prev,
                          actionPayloadJson: e.target.value,
                        }))
                      }
                    />
                    {selectedCampaignTarget && (
                      <button
                        type="button"
                        className="text-[11px] text-teal-600 hover:underline"
                        onClick={() =>
                          setCampaignForm((prev) => ({
                            ...prev,
                            actionPayloadJson:
                              selectedCampaignTarget.payloadExampleJson,
                          }))
                        }
                      >
                        Dùng payload mẫu ↑
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Switch
                      id="send-all"
                      checked={campaignForm.sendToAllUsers}
                      onCheckedChange={(checked) =>
                        setCampaignForm((prev) => ({
                          ...prev,
                          sendToAllUsers: checked,
                        }))
                      }
                    />
                    <Label htmlFor="send-all" className="text-sm text-gray-600">
                      Gửi cho tất cả người dùng
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 gap-1.5"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Tạo Chiến Dịch
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    Lịch Sử Chiến Dịch
                    {dispatches && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        ({dispatches.totalCount} tổng)
                      </span>
                    )}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={loadDispatches}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                    />
                    Làm mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {dispatchItems.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">
                    Chưa có chiến dịch nào.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">ID</TableHead>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Lịch gửi</TableHead>
                        <TableHead>Đã gửi</TableHead>
                        <TableHead className="text-right">Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dispatchItems.map((d) => {
                        const sc = statusConfig(d.status);
                        const StatusIcon = sc.icon;
                        return (
                          <TableRow key={d.notificationDispatchId}>
                            <TableCell className="font-mono text-xs text-gray-500">
                              #{d.notificationDispatchId}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                {d.title}
                              </p>
                              <p className="text-xs text-gray-400 truncate max-w-[200px]">
                                {d.content}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {d.notificationType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {formatDate(d.scheduledAt)}
                            </TableCell>
                            <TableCell className="text-xs text-gray-500">
                              {formatDate(d.sentAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={sc.variant}
                                className={sc.className}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {sc.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Delivery Logs ── */}
        <TabsContent value="delivery-logs" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Các dispatch bị lỗi. Bấm <strong>Process Due</strong> để trigger
              retry.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={loadFailedDispatches}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Làm mới
              </Button>
              <Button
                size="sm"
                className="gap-1.5 bg-teal-600 hover:bg-teal-700"
                onClick={onProcessDue}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                Process Due Dispatches
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Lỗi</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-gray-400"
                      >
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                        <p className="text-sm">
                          Không có dispatch nào bị lỗi 🎉
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    failedItems.map((d) => (
                      <TableRow key={d.notificationDispatchId}>
                        <TableCell className="font-mono text-xs text-gray-500">
                          #{d.notificationDispatchId}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-gray-800">
                          {d.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {d.notificationType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={
                              d.priority === "HIGH"
                                ? "bg-orange-50 text-orange-700"
                                : ""
                            }
                          >
                            {d.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-red-500 max-w-[200px] truncate">
                          {d.errorMessage ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {formatDate(d.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="destructive"
                            className="bg-red-50 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Thất bại
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Hangfire Performance ── */}
        <TabsContent value="hangfire" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Dashboard hiệu suất xử lý background jobs — Hangfire.
              </p>
            </div>
            <a
              href="http://localhost:8080/hangfire/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mở trong tab mới
            </a>
          </div>

          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <iframe
                src="http://localhost:8080/hangfire/"
                title="Hangfire Dashboard"
                className="w-full border-0"
                style={{ height: "calc(100vh - 220px)", minHeight: "600px" }}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
