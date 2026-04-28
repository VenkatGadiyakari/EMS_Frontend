import React from 'react';
import { BuyerLayout } from '@/components/buyer-layout';

const BookingsView: React.FC = () => {
  return (
    <BuyerLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-sm">No bookings yet.</p>
        </div>
      </div>
    </BuyerLayout>
  );
};

export default BookingsView;
