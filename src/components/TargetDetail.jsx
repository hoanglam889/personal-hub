import { useState } from 'react';
import { Button, Card, Badge, ProgressBar, Modal } from 'react-bootstrap';
import { Trash2 } from 'lucide-react';

const TargetDetail = ({ target, progress, onBack, onToggleTodo, onAddTodo, onDeleteTodo }) => {
  const [isFormExpanded, setIsFormExpanded] = useState(false); // Trạng thái đóng/mở form nhập việc mới
  const [taskName, setTaskName] = useState('');                 // Lưu tên việc cần làm (task_name)
  const [note, setNote] = useState('');                         // Lưu ghi chú chi tiết (note)
  const [showConfirmModal, setShowConfirmModal] = useState(false); // State hiển thị Modal xác nhận xóa
  const [todoToDelete, setTodoToDelete] = useState(null);         // Lưu to-do đang chuẩn bị xóa

  // Hàm xử lý khi bấm nút "Lưu lại" để thêm công việc mới
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return; // Không cho phép để trống tên việc
    
    // Gọi hàm onAddTodo được truyền từ App.jsx để cập nhật state và lưu DB
    onAddTodo(target.id, taskName, note);
    
    // Reset các trường nhập liệu về rỗng và đóng form
    setTaskName('');
    setNote('');
    setIsFormExpanded(false);
  };

  // Hàm xử lý khi bấm nút "Hủy" thêm mới
  const handleCancel = () => {
    setTaskName('');
    setNote('');
    setIsFormExpanded(false);
  };

  // Hàm kích hoạt Modal xác nhận xóa khi click icon thùng rác
  const promptDelete = (e, item) => {
    e.stopPropagation(); // Ngăn sự kiện nổi bọt để tránh click trúng dòng làm đổi trạng thái check/uncheck
    setTodoToDelete(item);
    setShowConfirmModal(true);
  };

  // Hàm xác nhận xóa việc nhỏ
  const confirmDelete = () => {
    if (todoToDelete) {
      onDeleteTodo(todoToDelete.id);
      setShowConfirmModal(false);
      setTodoToDelete(null);
    }
  };

  // Hàm hủy bỏ việc xóa
  const cancelDelete = () => {
    setShowConfirmModal(false);
    setTodoToDelete(null);
  };

  if (!target) return null;

  return (
    <div className="py-2">
      <Button 
        variant="light" 
        className="mb-4 d-flex align-items-center gap-2 shadow-sm border" 
        onClick={onBack}
      >
        ← Quay lại Trang Chủ
      </Button>
      
      <Card className="shadow-sm border-0 bg-primary text-white p-4">
        <Card.Body className="p-0">
          <div className="d-flex justify-content-between">
            <small className="text-white-50">CHI TIẾT MỤC TIÊU</small>
            <Badge bg="warning" text="dark">QUAN TRỌNG</Badge>
          </div>
          <h3 className="mt-2 fw-bold">{target.title}</h3>
          
          <ProgressBar now={progress} variant="success" className="mt-3" style={{ height: '10px' }} />
          
          <div className="d-flex justify-content-between mt-2 small text-white-50">
            <span>Tiến độ: {progress}%</span>
            <span>Deadline: {target.deadline ? new Date(target.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
          </div>

          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2 border-bottom border-white border-opacity-10 pb-2">
              <strong style={{ fontSize: '0.9rem' }}>CÁC BƯỚC CẦN LÀM:</strong>
              <Badge bg="light" text="dark">{target.todos?.length || 0} việc</Badge>
            </div>
            
            <div className="todo-list" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
              {target.todos && target.todos.length > 0 ? (
                target.todos.map((item, index) => (
                  <div 
                    key={item?.id} 
                    className={`d-flex align-items-center justify-content-between py-3 ${index !== target.todos.length - 1 ? 'border-bottom border-white border-opacity-10' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onToggleTodo(item.id)} 
                  >
                    <div className="d-flex align-items-start">
                      {/* Khung check tròn tự làm y hệt ngoài trang chủ */}
                      <div 
                        className="me-3 d-flex align-items-center justify-content-center border rounded-circle mt-1" 
                        style={{ 
                          width: '20px', 
                          height: '20px', 
                          minWidth: '20px',
                          backgroundColor: item.is_done ? '#28a745' : 'transparent',
                          borderColor: 'white',
                          transition: 'all 0.3s'
                        }}
                      >
                        {item.is_done === 1 && <small style={{ fontSize: '12px' }}>✓</small>}
                      </div>

                      <div className="d-flex flex-column text-start">
                        <span style={{ 
                          textDecoration: item.is_done ? 'line-through' : 'none',
                          opacity: item.is_done ? 0.7 : 1,
                          fontSize: '1rem',
                          fontWeight: '700',
                          lineHeight: '1.2'
                        }}>
                          {item.task_name}
                        </span>
                        
                        {item.note && (
                          <small style={{ fontSize: '0.85rem', opacity: 0.6, fontStyle: 'italic', marginTop: '3px' }}>
                            • {item.note}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Nút xóa việc nhỏ con */}
                    <Button 
                      variant="link" 
                      className="p-0 text-white-50 opacity-75 hover-opacity-100" 
                      onClick={(e) => promptDelete(e, item)}
                      title="Xóa việc này"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-white-50 font-italic mt-2">Mục tiêu này chưa có công việc con nào.</p>
              )}
            </div>
          </div>

          {/* PHẦN FORM THÊM VIỆC NHỎ MỚI */}
          {!isFormExpanded ? (
            // Nút bấm nét đứt màu trắng mờ khi chưa mở form
            <Button 
              variant="outline-light" 
              className="mt-3 w-100 d-flex align-items-center justify-content-center gap-2"
              style={{ borderStyle: 'dashed', opacity: 0.8 }}
              onClick={() => setIsFormExpanded(true)}
            >
              + Thêm công việc nhỏ
            </Button>
          ) : (
            // Form nhập liệu xuất hiện dạng Glassmorphism mờ đẹp mắt
            <form onSubmit={handleSubmit} className="mt-3 p-3 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="mb-2">
                <label className="form-label small text-white-50 mb-1">TÊN CÔNG VIỆC NHỎ</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm text-white placeholder-white-50" 
                  placeholder="Ví dụ: Đọc chương 1 sách React..." 
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  required
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff'
                  }}
                />
              </div>

              <div className="mb-3">
                <label className="form-label small text-white-50 mb-1">GHI CHÚ / MÔ TẢ (NẾU CÓ)</label>
                <input 
                  type="text" 
                  className="form-control form-control-sm text-white placeholder-white-50" 
                  placeholder="Ví dụ: Đọc kỹ phần hooks..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff'
                  }}
                />
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <Button variant="light" size="sm" type="submit">
                  Lưu lại
                </Button>
                <Button variant="outline-light" size="sm" type="button" onClick={handleCancel}>
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </Card.Body>
      </Card>
      {/* MODAL XÁC NHẬN XÓA CỦA REACT-BOOTSTRAP */}
      <Modal show={showConfirmModal} onHide={cancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-danger">Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-dark">
          Bạn có chắc chắn muốn xóa công việc nhỏ: <strong>{todoToDelete?.task_name}</strong> không? Hành động này không thể hoàn tác!
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Đồng ý xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TargetDetail;
