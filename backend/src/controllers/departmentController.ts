import { Request, Response } from "express";
import { getAllDepartmentsService } from "../services/departmentService";
import { responseMessage } from "../utils/responseMessage";

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await getAllDepartmentsService();
    return res.status(200).json({
      success: true,
      message: responseMessage.department.fetchSuccess,
      data: departments
    });
  } catch (err: any) {
    console.error("Failed to fetch departments:", err);
     return res.status(500).json({
      success: false,
      message: err.message || responseMessage.error("departments")
    });
  }
};
