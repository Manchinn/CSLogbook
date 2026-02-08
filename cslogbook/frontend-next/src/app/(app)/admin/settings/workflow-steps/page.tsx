"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  listWorkflowSteps,
  createWorkflowStep,
  updateWorkflowStep,
  deleteWorkflowStep,
  reorderWorkflowSteps,
  getWorkflowStepStats,
  type WorkflowStep,
} from "@/lib/services/workflowStepService";
import styles from "../settings.module.css";

type StepForm = {
  stepId?: number | null;
  workflowType: "internship" | "project";
  stepKey: string;
  stepOrder: string;
  title: string;
  descriptionTemplate: string;
  isRequired: boolean;
  dependencies: string;
};

const emptyForm: StepForm = {
  stepId: null,
  workflowType: "internship",
  stepKey: "",
  stepOrder: "",
  title: "",
  descriptionTemplate: "",
  isRequired: true,
  dependencies: "",
};

export default function WorkflowStepsSettingsPage() {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [formState, setFormState] = useState<StepForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [workflowType, setWorkflowType] = useState<"internship" | "project" | "">("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");
  const [orderMap, setOrderMap] = useState<Record<number, number>>({});
  const [stepStats, setStepStats] = useState<Record<string, unknown> | null>(null);

  const loadSteps = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await listWorkflowSteps({ workflowType: workflowType || undefined, search });
      const nextSteps = data?.steps ?? [];
      setSteps(nextSteps);
      setOrderMap(
        nextSteps.reduce<Record<number, number>>((acc, step) => {
          acc[step.stepId] = step.stepOrder;
          return acc;
        }, {})
      );
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูลขั้นตอน workflow ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSteps();
  }, []);

  const updateField = (key: keyof StepForm, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setFormState(emptyForm);

  const handleEdit = (step: WorkflowStep) => {
    setFormState({
      stepId: step.stepId,
      workflowType: step.workflowType,
      stepKey: step.stepKey,
      stepOrder: String(step.stepOrder),
      title: step.title,
      descriptionTemplate: step.descriptionTemplate ?? "",
      isRequired: Boolean(step.isRequired),
      dependencies: step.dependencies ? JSON.stringify(step.dependencies) : "",
    });
  };

  const handleSave = async () => {
    if (!formState.stepKey || !formState.title || formState.stepOrder === "") {
      setMessageTone("warning");
      setMessage("กรุณากรอกข้อมูลที่จำเป็น: stepKey, title, stepOrder");
      return;
    }

    let dependencies: unknown = null;
    if (formState.dependencies) {
      try {
        dependencies = JSON.parse(formState.dependencies);
      } catch {
        setMessageTone("warning");
        setMessage("รูปแบบ dependencies ไม่ถูกต้อง (ต้องเป็น JSON) ");
        return;
      }
    }

    const payload = {
      workflowType: formState.workflowType,
      stepKey: formState.stepKey,
      stepOrder: Number(formState.stepOrder),
      title: formState.title,
      descriptionTemplate: formState.descriptionTemplate || undefined,
      isRequired: formState.isRequired,
      dependencies,
    };

    setLoading(true);
    setMessage(null);
    try {
      if (formState.stepId) {
        await updateWorkflowStep(formState.stepId, payload);
        setMessageTone("success");
        setMessage("อัปเดตขั้นตอนเรียบร้อยแล้ว");
      } else {
        await createWorkflowStep(payload);
        setMessageTone("success");
        setMessage("สร้างขั้นตอนใหม่เรียบร้อยแล้ว");
      }
      resetForm();
      await loadSteps();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถบันทึกขั้นตอนได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stepId: number) => {
    setLoading(true);
    setMessage(null);
    try {
      await deleteWorkflowStep(stepId);
      setMessageTone("success");
      setMessage("ลบขั้นตอนเรียบร้อยแล้ว");
      await loadSteps();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถลบขั้นตอนได้");
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async () => {
    if (!workflowType) {
      setMessageTone("warning");
      setMessage("กรุณาเลือก workflow type ก่อนจัดเรียงลำดับ");
      return;
    }

    const stepOrders = steps
      .filter((step) => step.workflowType === workflowType)
      .map((step) => ({ stepId: step.stepId, newOrder: orderMap[step.stepId] ?? step.stepOrder }));

    setLoading(true);
    setMessage(null);
    try {
      await reorderWorkflowSteps({ workflowType, stepOrders });
      setMessageTone("success");
      setMessage("จัดเรียงลำดับขั้นตอนเรียบร้อยแล้ว");
      await loadSteps();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถจัดเรียงลำดับได้");
    } finally {
      setLoading(false);
    }
  };

  const handleStats = async (stepId: number) => {
    try {
      const stats = await getWorkflowStepStats(stepId);
      setStepStats(stats ?? null);
    } catch {
      setStepStats(null);
    }
  };

  const filteredSteps = useMemo(() => {
    if (!workflowType) return steps;
    return steps.filter((step) => step.workflowType === workflowType);
  }, [steps, workflowType]);

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>จัดการขั้นตอน Workflow</h1>
          <p className={styles.subtitle}>แก้ไขขั้นตอนฝึกงานและโครงงานพิเศษให้ตรงตามกระบวนการจริง</p>
        </header>

        {message ? (
          <div
            className={`${styles.alert} ${
              messageTone === "success"
                ? styles.alertSuccess
                : messageTone === "warning"
                  ? styles.alertWarning
                  : styles.alertInfo
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>{formState.stepId ? "แก้ไขขั้นตอน" : "สร้างขั้นตอนใหม่"}</strong>
            <div className={styles.actions}>
              <button type="button" className={styles.button} onClick={resetForm}>
                ล้างฟอร์ม
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleSave}
                disabled={loading}
              >
                บันทึกขั้นตอน
              </button>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Workflow Type
              <select
                className={styles.select}
                value={formState.workflowType}
                onChange={(event) => updateField("workflowType", event.target.value as "internship" | "project")}
              >
                <option value="internship">Internship</option>
                <option value="project">Project</option>
              </select>
            </label>
            <label className={styles.field}>
              Step Key
              <input
                className={styles.input}
                value={formState.stepKey}
                onChange={(event) => updateField("stepKey", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              Step Order
              <input
                type="number"
                className={styles.input}
                value={formState.stepOrder}
                onChange={(event) => updateField("stepOrder", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              Title
              <input
                className={styles.input}
                value={formState.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>
          </div>

          <label className={styles.field}>
            Description Template
            <textarea
              className={styles.textarea}
              value={formState.descriptionTemplate}
              onChange={(event) => updateField("descriptionTemplate", event.target.value)}
            />
          </label>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              Required
              <select
                className={styles.select}
                value={formState.isRequired ? "true" : "false"}
                onChange={(event) => updateField("isRequired", event.target.value === "true")}
              >
                <option value="true">จำเป็น</option>
                <option value="false">ไม่จำเป็น</option>
              </select>
            </label>
            <label className={styles.field}>
              Dependencies (JSON)
              <textarea
                className={styles.textarea}
                value={formState.dependencies}
                onChange={(event) => updateField("dependencies", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>รายการขั้นตอน</strong>
            <div className={styles.actions}>
              <select
                className={styles.select}
                value={workflowType}
                onChange={(event) => setWorkflowType(event.target.value as "internship" | "project" | "")}
              >
                <option value="">ทั้งหมด</option>
                <option value="internship">Internship</option>
                <option value="project">Project</option>
              </select>
              <input
                className={styles.input}
                placeholder="ค้นหา"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="button" className={styles.button} onClick={loadSteps} disabled={loading}>
                รีเฟรช
              </button>
              <button type="button" className={styles.button} onClick={handleReorder} disabled={loading}>
                บันทึกลำดับใหม่
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ประเภท</th>
                  <th>Step Key</th>
                  <th>ชื่อขั้นตอน</th>
                  <th>ลำดับ</th>
                  <th>Required</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredSteps.map((step) => (
                  <tr key={step.stepId}>
                    <td>{step.workflowType}</td>
                    <td>{step.stepKey}</td>
                    <td>{step.title}</td>
                    <td>
                      <input
                        type="number"
                        className={styles.input}
                        value={orderMap[step.stepId] ?? step.stepOrder}
                        onChange={(event) =>
                          setOrderMap((prev) => ({
                            ...prev,
                            [step.stepId]: Number(event.target.value),
                          }))
                        }
                      />
                    </td>
                    <td>{step.isRequired ? "Yes" : "No"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" className={styles.button} onClick={() => handleEdit(step)}>
                          แก้ไข
                        </button>
                        <button type="button" className={styles.button} onClick={() => handleStats(step.stepId)}>
                          สถิติ
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => handleDelete(step.stepId)}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stepStats ? (
            <div className={styles.card}>
              <div className={styles.cardTitle}>สถิติการใช้งานขั้นตอน</div>
              <pre className={styles.cardMeta}>{JSON.stringify(stepStats, null, 2)}</pre>
            </div>
          ) : null}
        </section>

      </div>
    </RoleGuard>
  );
}
