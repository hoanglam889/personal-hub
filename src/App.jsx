import { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Offcanvas, ListGroup, Modal } from 'react-bootstrap';
import { Target, Menu, Pin, PinOff, Trash2, ArrowUpRight, ArrowDownLeft, Calendar, Edit3 } from 'lucide-react';
import { getTargetsWithTodos, updateTodoStatus, pinTarget, deleteTarget, unpinTarget, addTarget, addTodo, deleteTodo, addTransaction, getTodaySummary, updateTransaction, deleteTransaction } from './services/targetService.js';
import PinnedTargetCard from './components/PinnedTargetCard';
import TargetDetail from './components/TargetDetail';
import FinanceInputCard from './components/FinanceInputCard';
import FinanceCalendar from './components/FinanceCalendar';
function App() {
  //Lâm viết hứng target
  const [targets, setTargets] = useState([]);
  // State hứng tổng quan thu chi và danh sách giao dịch hôm nay
  const [todaySummary, setTodaySummary] = useState({
    today_spent: 0,
    today_received: 0,
    transactions: []
  });

  // State quản lý việc sửa đổi giao dịch tài chính
  const [editingTransaction, setEditingTransaction] = useState(null);

  // State quản lý Modal xác nhận xóa mục tiêu
  const [targetToDelete, setTargetToDelete] = useState(null);
  const [showTargetDeleteModal, setShowTargetDeleteModal] = useState(false);

  // State quản lý tab hoạt động ('input' là trang Ghi chép, 'calendar' là trang Lịch)
  const [activeTab, setActiveTab] = useState('input');

  useEffect(() => {
    getTargetsWithTodos().then(data => setTargets(data));
    getTodaySummary().then(summary => setTodaySummary(summary));
  }, []);

  const [showMenu, setShowMenu] = useState(false); // State đóng/mở menu
  const [newTargetTitle, setNewTargetTitle] = useState(''); // State lưu chữ đang nhập mục tiêu mới


  // === BẠN HÃY TỰ VIẾT LOGIC TÍNH % Ở ĐÂY ===
    const currentProgress = useMemo(() => {
      const pinnedTarget = targets.find(t => t.is_pinned === 1);
      if (!pinnedTarget) return 0;
      const todos = pinnedTarget.todos || [];
      if (todos.length === 0) return 0;
      const doneCount = todos.filter(t => t.is_done === 1).length;
      return Math.round((doneCount / todos.length) * 100);
    }, [targets]);
  // Hãy tính toán để thay con số 0 này nhé
  // =========================================
  
  // Tìm mục tiêu đang được chọn để xem chi tiết
  const [selectedTargetId, setSelectedTargetId] = useState(null); // Dùng để theo dõi xem mình đang xem to-do của mục tiêu nào
  const activeTarget = targets.find(t => t.id === selectedTargetId); //lưu mảng chưa phần tử trùng id với id đc click

  // Tính toán % tiến độ riêng cho Target đang xem chi tiết
  const activeProgress = useMemo(() => {
    if (!activeTarget) return 0;
    const todos = activeTarget.todos || [];
    if (todos.length === 0) return 0;
    const doneCount = todos.filter(t => t.is_done === 1).length;
    return Math.round((doneCount / todos.length) * 100);
  }, [activeTarget]);


  // Hàm để đóng/mở
  const handleClose = () => setShowMenu(false);
  const handleShow = () => setShowMenu(true);

  //Hàm Ghim mục tiêu
  const handlePinTarget = async (targetId) => {
    // 1. Cập nhật giao diện liền cho mượt (Optimistic UI)
    setTargets(targets.map(t => ({
      ...t,
      is_pinned: t.id === targetId ? 1 : 0
    })));
    // 2. Gọi API ngầm dưới nền
    try {
      await pinTarget(targetId);
    } catch (err) {
      console.error("Lỗi ghim:", err);
    }
  };

  //Hàm hủy ghim mục tiêu
  const handleunPinTarget = async (targetId) => {
    // 1. Cập nhật giao diện liền cho mượt (khi hủy ghim thì không có cái nào được ghim hết)
    setTargets(targets.map(t => ({
      ...t,
      is_pinned: 0
    })));
    // 2. Gọi API ngầm dưới nền
    try {
      await unpinTarget(targetId);
    } catch (err) {
      console.error("Lỗi hủy ghim:", err);
    }
  };
  
  // Kích hoạt Modal xác nhận xóa mục tiêu khi click icon thùng rác
  const handleDeleteTarget = (targetId) => {
    const target = targets.find(t => t.id === targetId);
    if (target) {
      setTargetToDelete(target);
      setShowTargetDeleteModal(true);
    }
  };

  // Xác nhận thực sự xóa mục tiêu khỏi DB và UI
  const confirmDeleteTarget = async () => {
    if (targetToDelete) {
      const targetId = targetToDelete.id;
      // Cập nhật giao diện liền
      setTargets(targets.filter(t => t.id !== targetId));
      setShowTargetDeleteModal(false);
      setTargetToDelete(null);

      // Nếu đang chọn chi tiết mục tiêu này thì quay lại trang chủ
      if (selectedTargetId === targetId) {
        setSelectedTargetId(null);
      }

      try {
        await deleteTarget(targetId);
      } catch (err) {
        console.error("Lỗi khi xóa mục tiêu:", err);
      }
    }
  };

  // Hàm Thêm mục tiêu mới
  const handleAddTarget = async () => {
    if (!newTargetTitle.trim()) return;
    try {
      const result = await addTarget(newTargetTitle);
      
      // Thêm target mới vào danh sách hiện tại của State
      setTargets([...targets, {
        id: result.id,
        title: result.title,
        is_pinned: 0,
        todos: [] // Khởi tạo mảng to-do con rỗng tuếch
      }]);
      
      setNewTargetTitle(''); // Xóa chữ trong ô nhập sau khi thêm xong
    } catch (err) {
      console.error("Lỗi khi thêm mục tiêu:", err);
    }
  };
  //Hàm đổi trạng thái to-do
  const handeToggleTodo = async(todoId) => {
    let newStatus;
    const updatedTargets = targets.map(target => ({
      ...target,
      todos: target.todos?.map(todo => {
        if (todo.id === todoId){
          newStatus = todo.is_done === 1 ? 0 : 1;
        return {...todo, is_done: newStatus};
      }
      return todo;
      })
    }));
    setTargets(updatedTargets);
    try {
      await updateTodoStatus(todoId, newStatus);
    } catch (err) {
      console.error("Lỗi sync database:", err);
      // Nếu muốn kỹ, ông có thể reset lại state targets ở đây nếu server lỗi
    }
  };

  // Hàm thêm việc nhỏ (to-do) mới vào một mục tiêu (target) cụ thể
  // Nhận vào targetId (id mục tiêu cha), taskName (tên việc cần làm) và note (ghi chú chi tiết)
  const handleAddTodo = async (targetId, taskName, note) => {
    try {
      // Gọi API thêm todo qua service
      const result = await addTodo(targetId, taskName, note);
      
      // Cập nhật lại state `targets` để giao diện tự vẽ lại tức thì với công việc mới
      const updatedTargets = targets.map(target => {
        if (target.id === targetId) {
          return {
            ...target,
            // Thêm to-do con mới vào mảng todos hiện tại của target này
            todos: [...(target.todos || []), {
              id: result.id,
              task_name: result.task_name,
              note: result.note,
              is_done: result.is_done
            }]
          };
        }
        return target;
      });
      setTargets(updatedTargets);
    } catch (err) {
      console.error("Lỗi khi thêm việc nhỏ ở App:", err);
    }
  };

  // Hàm xóa một việc nhỏ (to-do) khỏi mục tiêu
  // Nhận vào todoId (id của công việc cần xóa)
  const handleDeleteTodo = async (todoId) => {
    try {
      // Gọi service xóa ở backend
      await deleteTodo(todoId);
      
      // Cập nhật lại state `targets` để lọc bỏ việc nhỏ vừa xóa khỏi danh sách
      const updatedTargets = targets.map(target => ({
        ...target,
        todos: target.todos?.filter(todo => todo.id !== todoId) || []
      }));
      setTargets(updatedTargets);
    } catch (err) {
      console.error("Lỗi khi xóa việc nhỏ ở App:", err);
    }
  };

  // Hàm thêm mới giao dịch tài chính (Thu hoặc Chi)
  // Nhận vào transactionData: { amount, note, category_name, transaction_date }
  const handleAddTransaction = async (transactionData) => {
    try {
      await addTransaction(transactionData);
      // Tải lại tổng quan tài chính hôm nay để đồng bộ giao diện
      const summary = await getTodaySummary();
      setTodaySummary(summary);
    } catch (err) {
      console.error("Lỗi khi thêm giao dịch ở App:", err);
    }
  };

  // Hàm cập nhật giao dịch tài chính (Thu hoặc Chi)
  // Nhận vào txId (id giao dịch cần sửa) và transactionData: { amount, note, category_name, transaction_date }
  const handleUpdateTransaction = async (txId, transactionData) => {
    try {
      await updateTransaction(txId, transactionData);
      // Tải lại tổng quan tài chính hôm nay để đồng bộ giao diện
      const summary = await getTodaySummary();
      setTodaySummary(summary);
      setEditingTransaction(null); // Quay lại trang chủ
    } catch (err) {
      console.error("Lỗi khi cập nhật giao dịch ở App:", err);
    }
  };

  // Hàm xóa giao dịch tài chính
  // Nhận vào txId (id giao dịch cần xóa)
  const handleDeleteTransaction = async (txId) => {
    try {
      await deleteTransaction(txId);
      // Tải lại tổng quan tài chính hôm nay để đồng bộ giao diện
      const summary = await getTodaySummary();
      setTodaySummary(summary);
      setEditingTransaction(null); // Quay lại trang chủ
    } catch (err) {
      console.error("Lỗi khi xóa giao dịch ở App:", err);
    }
  };

  return (
    <Container 
      className="pt-0" 
      fluid 
      style={{ 
        backgroundColor: '#f8f9fa', 
        minHeight: '100vh',
        paddingBottom: (!activeTarget && !editingTransaction) ? '80px' : '20px'
      }}
    >
      
      {/* THANH NAVBAR TRÊN CÙNG CÓ HAMBURGER */}
      <div className="sticky-top d-flex justify-content-between align-items-center p-3 bg-white shadow-sm mb-4" style={{ top: 0, zIndex: 1020 }}>
        <Button variant="light" onClick={handleShow}>
          <Menu size={24} />
        </Button>
        <h5 className="mb-0 fw-bold">LAM'S HUB</h5>
        <div style={{ width: '40px' }}></div> {/* Để căn giữa cái title */}
      </div>

      <Container>
        {editingTransaction ? (
          // ==========================================
          // GIAO DIỆN CHỈNH SỬA GIAO DỊCH TÀI CHÍNH ("Trang Mới")
          // ==========================================
          <div className="py-2">
            <Button 
              variant="light" 
              className="mb-3 d-flex align-items-center gap-2 shadow-sm border btn-sm" 
              onClick={() => setEditingTransaction(null)}
            >
              ← Quay lại Trang Chủ
            </Button>
            
            <FinanceInputCard 
              key={`edit-${editingTransaction.id}`}
              initialData={editingTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onCancel={() => setEditingTransaction(null)}
            />
          </div>
        ) : activeTarget ? (
          <TargetDetail 
            target={activeTarget}
            progress={activeProgress}
            onBack={() => setSelectedTargetId(null)}
            onToggleTodo={handeToggleTodo}
            onAddTodo={handleAddTodo}
            onDeleteTodo={handleDeleteTodo}
          />
        ) : activeTab === 'calendar' ? (
          <FinanceCalendar onEditTransaction={(tx) => setEditingTransaction(tx)} />
        ) : (
          // ==========================================
          // HIỂN THỊ TRANG CHỦ MẶC ĐỊNH
          // ==========================================
          <>
            {/* CHỈ HIỆN CÁI GÌ ĐƯỢC GHIM (PINNED) Ở ĐÂY */}
            <Row className="mb-2">
              <Col>
                {/* Truyền mảng targets qua để bên kia nó tự tìm thằng is_pinned === 1 */}
                <PinnedTargetCard targets={targets} progress={currentProgress} onToggle={handeToggleTodo} />
              </Col>
            </Row>

            {/* PHẦN NHẬP KHOẢN THU/CHI TÀI CHÍNH */}
            <Row className="mb-2">
              <Col>
                <FinanceInputCard key="add" onAddTransaction={handleAddTransaction} />
              </Col>
            </Row>

            {/* TỔNG QUAN TÀI CHÍNH HÔM NAY */}
            <Row className="mb-2">
              <Col>
                <Card className="shadow-sm border-0" style={{ borderRadius: '15px' }}>
                  <Card.Body className="p-3">
                    <Row className="mb-2 text-center">
                      <Col xs={6} className="border-end">
                        <div className="d-flex align-items-center justify-content-center gap-1 text-danger small fw-bold" style={{ fontSize: '0.8rem' }}>
                          <ArrowDownLeft size={14} /> HÔM NAY CHI
                        </div>
                        <h4 className="fw-bold text-danger mt-1 mb-0" style={{ fontSize: '1.3rem' }}>
                          {todaySummary.today_spent > 0 
                            ? `-${todaySummary.today_spent.toLocaleString('vi-VN')}đ` 
                            : '0đ'}
                        </h4>
                      </Col>
                      <Col xs={6}>
                        <div className="d-flex align-items-center justify-content-center gap-1 text-success small fw-bold" style={{ fontSize: '0.8rem' }}>
                          <ArrowUpRight size={14} /> HÔM NAY THU
                        </div>
                        <h4 className="fw-bold text-success mt-1 mb-0" style={{ fontSize: '1.3rem' }}>
                          {todaySummary.today_received > 0 
                            ? `+${todaySummary.today_received.toLocaleString('vi-VN')}đ` 
                            : '0đ'}
                        </h4>
                      </Col>
                    </Row>

                    <div className="border-top pt-2">
                      <strong className="d-block mb-1 text-muted text-start" style={{ fontSize: '0.8rem' }}>
                        CHI TIẾT CÁC KHOẢN GIAO DỊCH:
                      </strong>
                      
                      <div className="transaction-list" style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '5px' }}>
                        {todaySummary.transactions && todaySummary.transactions.length > 0 ? (
                          todaySummary.transactions.map((tx) => {
                            const isExpense = tx.amount < 0;
                            return (
                              <div 
                                key={tx.id} 
                                className="d-flex align-items-center justify-content-between py-1 border-bottom border-light"
                                style={{ transition: 'all 0.2s', fontSize: '0.9rem', cursor: 'pointer' }}
                                onClick={() => setEditingTransaction(tx)}
                                title="Nhấp để sửa hoặc xóa giao dịch"
                              >
                                <div className="text-start">
                                  <Badge 
                                    bg={isExpense ? 'danger' : 'success'} 
                                    className="me-2 text-white"
                                    style={{ fontSize: '0.7rem', opacity: 0.9 }}
                                  >
                                    {tx.category_name}
                                  </Badge>
                                  {tx.note && (
                                    <span className="small text-muted" style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                                      {tx.note}
                                    </span>
                                  )}
                                </div>
                                <span className={`fw-bold ${isExpense ? 'text-danger' : 'text-success'}`}>
                                  {isExpense 
                                    ? `-${Math.abs(tx.amount).toLocaleString('vi-VN')}đ` 
                                    : `+${tx.amount.toLocaleString('vi-VN')}đ`}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center text-muted py-2 small" style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                            Chưa có khoản thu chi nào được ghi nhận hôm nay.
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>

      {/* CÁI HAMBURGER MENU (OFFCANVAS) */}
      <Offcanvas show={showMenu} onHide={handleClose}>
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="fw-bold">DANH MỤC MỤC TIÊU</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {/* Ô NHẬP MỤC TIÊU MỚI (DẤU +) */}
          <div className="p-3 bg-light border-bottom">
            <div className="d-flex gap-2">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nhập tên mục tiêu mới..."
                value={newTargetTitle}
                onChange={(e) => setNewTargetTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTarget();
                }}
              />
              <Button variant="primary" onClick={handleAddTarget}>
                +
              </Button>
            </div>
          </div>

          <ListGroup variant="flush">
            {targets.map(target => (
              <ListGroup.Item key={target.id} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div 
                  className="d-flex align-items-center flex-grow-1" 
                  onClick={() => { 
                    setSelectedTargetId(target.id); // Chọn target để chuyển trang
                    handleClose();                 // Đóng menu Hamburger
                  }} 
                  style={{ cursor: 'pointer' }}
                >
                  <Target size={18} className={`me-3 ${target.is_pinned ? 'text-danger' : 'text-primary'}`} />
                  <span style={{ fontWeight: target.is_pinned ? 'bold' : 'normal', fontSize: '1.05rem' }}>
                    {target.title}
                  </span>
                  {target.is_pinned === 1 && <Badge bg="danger" className="ms-2" style={{ fontSize: '0.6rem' }}>ĐANG GHIM</Badge>}
                </div>
                <div className="d-flex gap-3 align-items-center">
                  {/* Nút Ghim */}
                  <Button 
                    variant="link" 
                    className="p-0 text-muted" 
                    onClick={() => handlePinTarget(target.id)} 
                    disabled={target.is_pinned === 1}
                    title="Ghim ra ngoài"
                  >
                    <Pin size={20} fill={target.is_pinned ? 'currentColor' : 'none'} color={target.is_pinned ? '#dc3545' : 'currentColor'} style={{ cursor: target.is_pinned ? 'not-allowed' : 'pointer' }} />
                  </Button>

                  {/* Nút Hủy Ghim */}
                  <Button 
                    variant="link" 
                    className="p-0 text-muted" 
                    onClick={() => handleunPinTarget(target.id)} 
                    disabled={target.is_pinned === 0}
                    title="Hủy ghim"
                  >
                    <PinOff size={20} color={target.is_pinned ? '#6c757d' : '#dee2e6'} style={{ cursor: target.is_pinned ? 'pointer' : 'not-allowed' }} />
                  </Button>

                  {/* Nút Xóa */}
                  <Button variant="link" className="p-0 text-danger opacity-75 hover-opacity-100" onClick={() => handleDeleteTarget(target.id)} title="Xóa mục tiêu">
                    <Trash2 size={20} style={{ cursor: 'pointer' }} />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>

      {/* MODAL XÁC NHẬN XÓA MỤC TIÊU */}
      <Modal show={showTargetDeleteModal} onHide={() => setShowTargetDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold text-danger">Xác nhận xóa mục tiêu</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-dark text-start">
          Bạn có chắc chắn muốn xóa mục tiêu: <strong>{targetToDelete?.title}</strong> không? Mọi công việc con bên trong cũng sẽ bay màu và hành động này không thể hoàn tác!
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTargetDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDeleteTarget}>
            Đồng ý xóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG (BOTTOM NAVIGATION BAR) */}
      {!activeTarget && !editingTransaction && (
        <div 
          className="fixed-bottom bg-white border-top d-flex justify-content-around align-items-center"
          style={{ 
            height: '65px', 
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
            zIndex: 1000 
          }}
        >
          <button 
            type="button"
            onClick={() => setActiveTab('input')}
            className="btn border-0 d-flex flex-column align-items-center justify-content-center"
            style={{ 
              color: activeTab === 'input' ? '#0d6efd' : '#6c757d',
              fontWeight: activeTab === 'input' ? 'bold' : 'normal',
              fontSize: '0.8rem',
              opacity: activeTab === 'input' ? 1 : 0.7
            }}
          >
            <Edit3 size={20} className="mb-1" color={activeTab === 'input' ? '#0d6efd' : '#6c757d'} />
            Nhập vào
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('calendar')}
            className="btn border-0 d-flex flex-column align-items-center justify-content-center"
            style={{ 
              color: activeTab === 'calendar' ? '#0d6efd' : '#6c757d',
              fontWeight: activeTab === 'calendar' ? 'bold' : 'normal',
              fontSize: '0.8rem',
              opacity: activeTab === 'calendar' ? 1 : 0.7
            }}
          >
            <Calendar size={20} className="mb-1" color={activeTab === 'calendar' ? '#0d6efd' : '#6c757d'} />
            Lịch
          </button>
        </div>
      )}

    </Container>
  );
}

export default App;