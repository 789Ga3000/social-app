import { Injectable } from '@nestjs/common';
import { CustomStoreService } from '../storage/custom-store.service';

@Injectable()
export class AdminService {
  constructor(private readonly store: CustomStoreService) {}

  async getStats() {
    return this.store.getAdminStats();
  }

  async listUsers() {
    return this.store.listAllUsersAdmin();
  }

  async toggleUserStatus(userId: string, isDisabled: boolean) {
    return this.store.toggleUserDisableStatus(userId, isDisabled);
  }

  async changeUserRole(userId: string, role: 'USER' | 'ADMIN') {
    return this.store.changeUserRole(userId, role);
  }

  async listPosts() {
    return this.store.listAllPostsAdmin();
  }

  async deletePost(postId: string) {
    return this.store.adminDeletePost(postId);
  }

  async restorePost(postId: string) {
    return this.store.adminRestorePost(postId);
  }

  async listComments() {
    return this.store.listAllCommentsAdmin();
  }

  async deleteComment(commentId: string) {
    return this.store.adminDeleteComment(commentId);
  }

  async restoreComment(commentId: string) {
    return this.store.adminRestoreComment(commentId);
  }

  async listReports() {
    return this.store.listReportsAdmin();
  }

  async resolveReport(reportId: string, action: 'DISMISS' | 'DELETE_POST' | 'BAN_USER', adminId: string) {
    return this.store.resolveReportAdmin(reportId, action, adminId);
  }
}
