import React from 'react';
import { FileText, RefreshCw } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Prescriptions: React.FC = () => {
  return (
    <PageWrapper 
      title="Quản lý đơn thuốc" 
      subtitle="Quản lý và phê duyệt đơn thuốc từ khách hàng"
      actions={
        <Button 
          variant="secondary" 
          size="sm" 
          icon={<RefreshCw className="w-4 h-4" />} 
          onClick={() => window.location.reload()}
        >
          Làm mới
        </Button>
      }
    >
      <Card className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
          <FileText size={40} />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Chức năng đang phát triển</h3>
        <p className="text-[var(--text-secondary)] max-w-sm mx-auto mb-8">
          Hệ thống tiếp nhận và xử lý đơn thuốc đang được bảo trì và nâng cấp để hỗ trợ phân phối đa chi nhánh tốt hơn.
        </p>
        <Button variant="secondary" onClick={() => window.history.back()}>
          Quay lại trang trước
        </Button>
      </Card>
    </PageWrapper>
  );
};

export default Prescriptions;
