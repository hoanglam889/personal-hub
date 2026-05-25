import { Card, Badge, ProgressBar } from 'react-bootstrap';

// KHÔNG IMPORT handeToggleTodo ở đây nhé Lâm!

const PinnedTargetCard = ({ targets, progress, onToggle }) => {
    const pinnedTarget = targets.find(t => t.is_pinned === 1);
    
    if (!pinnedTarget) return null; // Chốt chặn nếu không tìm thấy target

    return (
        <Card className="shadow-sm border-0 bg-primary text-white">
            <Card.Body>
                <div className="d-flex justify-content-between">
                    <small>MỤC TIÊU ĐANG ĐUỔI THEO</small>
                    <Badge bg="warning" text="dark">QUAN TRỌNG</Badge>
                </div>
                <h3 className="mt-2">{pinnedTarget?.title}</h3>
                <ProgressBar now={progress} variant="success" className="mt-3" style={{ height: '10px' }} />
                <div className="d-flex justify-content-between mt-2 small">
                    <span>Tiến độ: {progress}%</span>
                    <span>Deadline: 30/06/2026</span>
                </div>

                <div className="mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong style={{ fontSize: '0.9rem' }}>CÁC BƯỚC CẦN LÀM:</strong>
                        <Badge bg="light" text="dark">{pinnedTarget?.todos?.length || 0} việc</Badge>
                    </div>
                    
                    <div className="todo-list" style={{ maxHeight: '180px', overflowY: 'auto', paddingRight: '5px' }}>
                        {pinnedTarget?.todos?.map((item, index) => ( // Tui đổi tên thành item cho đỡ lộn
                            <div 
                                key={item?.id} 
                                className={`d-flex align-items-start py-2 ${index !== pinnedTarget.todos.length - 1 ? 'border-bottom border-white border-opacity-10' : ''}`}
                                style={{ cursor: 'pointer' }}
                                // SỬA Ở ĐÂY: item.id chứ không phải todo.id
                                onClick={() => onToggle(item.id)} 
                            >
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

                                <div className="d-flex flex-column text-start"> {/* Đừng để text-center, todo list để start mới đẹp */}
                                    <span style={{ 
                                        textDecoration: item.is_done ? 'line-through' : 'none',
                                        opacity: item.is_done ? 0.7 : 1,
                                        fontSize: '0.95rem',
                                        fontWeight: '700',
                                        lineHeight: '1.2'
                                    }}>
                                        {item.task_name}
                                    </span>
                                    
                                    {item.note && (
                                        <small style={{ fontSize: '0.8rem', opacity: 0.5, fontStyle: 'italic', marginTop: '3px' }}>
                                            • {item.note}
                                        </small>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
}

export default PinnedTargetCard;