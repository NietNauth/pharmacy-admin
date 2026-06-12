import React from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { Card } from '../components/ui/Card';

interface PlaceholderPageProps {
  name: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ name }) => {
  return (
    <PageWrapper title={name}>
      <Card className="p-12 flex flex-col items-center justify-center text-[var(--text-secondary)]">
        <h3 className="text-xl font-medium mb-2">Trang {name} đang được phát triển</h3>
        <p>Tính năng này sẽ sớm ra mắt trong các bản cập nhật tiếp theo.</p>
      </Card>
    </PageWrapper>
  );
};

export default PlaceholderPage;
