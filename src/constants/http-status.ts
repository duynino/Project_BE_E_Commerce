const HTTP_STATUS = {
  OK: 200, // Thành công, yêu cầu đã được xử lý thành công
  CREATED: 201, // Đã tạo thành công một tài nguyên mới
  ACCEPTED: 202, // Yêu cầu đã được chấp nhận, nhưng quá trình xử lý vẫn đang diễn ra
  NO_CONTENT: 204, // Không có dữ liệu để trả về, thường được sử dụng trong trường hợp xóa thành công
  MOVED_PERMANENTLY: 301, // Đã chuyển hướng vĩnh viễn đến một URL khác
  UNPROCESSABLE_ENTITY: 422, // Yêu cầu không thể được xử lý do lỗi xác nhận từ phía máy chủ
  UNAUTHORIZED: 401, // Không được ủy quyền, yêu cầu yêu cầu xác thực
  NOT_FOUND: 404, // Không tìm thấy tài nguyên được yêu cầu
  INTERNAL_SERVER_ERROR: 500 // Lỗi nội bộ của máy chủ, thường xảy ra khi có lỗi không xác định
} as const;

export default HTTP_STATUS;
