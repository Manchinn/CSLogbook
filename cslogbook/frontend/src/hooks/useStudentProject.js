import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import projectService from '../services/projectService';
import { teacherService } from '../services/teacherService';
import { message } from 'antd';
import { evaluateProjectReadiness } from '../utils/projectReadiness';

/**
 * useStudentProject
 * Hook รวม logic ที่หน้าเกี่ยวกับ "โครงงานของนักศึกษา" ใช้ซ้ำได้หลายหน้า (TopicSubmitPage, ProjectDashboard ฯลฯ)
 * แนวคิด: Student ส่วนมากมี 0 หรือ 1 โครงงาน (ที่เป็น leader) + อาจร่วมเป็น member โครงงานอื่น -> เราเลือก project แรกเป็น active
 * ถ้าต้องการ rule ซับซ้อนกว่าค่อยเพิ่ม selector ภายหลัง
 */
export function useStudentProject(options = {}) {
  const { autoLoad = true } = options;

  // State หลัก
  const [projects, setProjects] = useState([]);            // รายการโครงงาน (mine)
  const [activeProject, setActiveProject] = useState(null); // โครงงานที่ถูกโฟกัส (default = first)
  const [advisors, setAdvisors] = useState([]);

  // Loading / error flags
  const [loading, setLoading] = useState(false);           // โหลดรายการโครงงาน
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [activating, setActivating] = useState(false);

  // ใช้ ref กัน race condition เมื่อมีการกดหลาย action พร้อมกัน
  const lastLoadToken = useRef(0);

  // โหลดรายการอาจารย์ที่ปรึกษา
  const loadAdvisors = useCallback(async () => {
    try {
      setAdvisorLoading(true);
      setAdvisorError(null);
      const list = await teacherService.getAdvisors();
      setAdvisors(list || []);
    } catch (e) {
      setAdvisorError(e.message || 'โหลดรายชื่ออาจารย์ล้มเหลว');
    } finally {
      setAdvisorLoading(false);
    }
  }, []);

  // โหลดโครงงานของตนเอง + ตั้ง activeProject
  const loadProjects = useCallback(async () => {
    const token = ++lastLoadToken.current;
    try {
      setLoading(true);
      const res = await projectService.getMyProjects();
      if (!res.success) {
        message.error(res.message || 'ดึงโครงงานล้มเหลว');
        return;
      }
      if (token !== lastLoadToken.current) return; // race: มีโหลดใหม่หลังสุด
      setProjects(res.data || []);
      const first = (res.data || [])[0];
      if (first) {
        // ดึงรายละเอียดเต็ม + summary
        const full = await projectService.getProjectWithSummary(first.projectId);
        if (full.success && token === lastLoadToken.current) {
          setActiveProject(full.data);
        }
      } else {
        setActiveProject(null);
      }
    } catch (e) {
      message.error(e.message);
    } finally {
      if (token === lastLoadToken.current) setLoading(false);
    }
  }, []);

  // Action: สร้างโครงงานใหม่
  const createProject = useCallback(async (payload) => {
    try {
      setCreating(true);
      const res = await projectService.createProject(payload);
      if (!res.success) {
        message.error(res.message || 'สร้างโครงงานไม่สำเร็จ');
        return false;
      }
      message.success('สร้างโครงงานสำเร็จ');
      await loadProjects();
      return true;
    } catch (e) {
      message.error(e.message);
      return false;
    } finally {
      setCreating(false);
    }
  }, [loadProjects]);

  // Action: อัปเดต metadata โครงงาน
  const updateProject = useCallback(async (payload) => {
    if (!activeProject) return false;
    try {
      setUpdating(true);
      const res = await projectService.updateProject(activeProject.projectId, payload);
      if (!res.success) {
        message.error(res.message || 'อัปเดตไม่สำเร็จ');
        return false;
      }
      message.success('อัปเดตโครงงานสำเร็จ');
      const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
      if (refreshed.success) setActiveProject(refreshed.data);
      return true;
    } catch (e) {
      message.error(e.message);
      return false;
    } finally {
      setUpdating(false);
    }
  }, [activeProject]);

  // Action: เพิ่มสมาชิก
  const addMember = useCallback(async (studentCode) => {
    if (!activeProject) return { success: false, message: 'ยังไม่มีโครงงาน' };
    try {
      setAddingMember(true);
      const res = await projectService.addMember(activeProject.projectId, studentCode);
      if (!res.success) return { success: false, message: res.message };
      const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
      if (refreshed.success) setActiveProject(refreshed.data);
      message.success('เพิ่มสมาชิกสำเร็จ');
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    } finally {
      setAddingMember(false);
    }
  }, [activeProject]);

  // Action: Activate project -> in_progress
  const activateProject = useCallback(async () => {
    if (!activeProject) return false;
    try {
      setActivating(true);
      const res = await projectService.activateProject(activeProject.projectId);
      if (!res.success) { message.error(res.message || 'เริ่มดำเนินการไม่สำเร็จ'); return false; }
      const refreshed = await projectService.getProjectWithSummary(activeProject.projectId);
      if (refreshed.success) setActiveProject(refreshed.data);
      message.success('โครงงานเข้าสู่สถานะ in_progress');
      return true;
    } catch (e) {
      message.error(e.message);
      return false;
    } finally {
      setActivating(false);
    }
  }, [activeProject]);

  // Readiness checklist (memo)
  const activationReadiness = useMemo(() => evaluateProjectReadiness(activeProject), [activeProject]);

  const readiness = activationReadiness.checklist;

  const canActivate = activationReadiness.canActivate;

  // ออโต้โหลดเมื่อ mount
  useEffect(() => { if (autoLoad) loadProjects(); }, [autoLoad, loadProjects]);
  useEffect(() => { if (autoLoad && advisors.length === 0) loadAdvisors(); }, [autoLoad, advisors.length, loadAdvisors]);

  return {
    // data
    projects,
    activeProject,
    advisors,
  readiness,
  canActivate,
  activationReadiness,
    // loading flags
    loading,
    advisorLoading,
    creating,
    updating,
    addingMember,
    activating,
    advisorError,
    // actions
    loadProjects,
    loadAdvisors,
    createProject,
    updateProject,
    addMember,
    activateProject,
    setActiveProject // เผื่อ UI ต้องสลับโครงงานเองในอนาคต
  };
}

export default useStudentProject;
