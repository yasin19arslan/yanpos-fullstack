import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Sidebar from '../components/admin/Sidebar';

const AdminLayout = ({ children }) => {
  return (
    <Flex minHeight="100vh">
      <Sidebar />
      <Box flex="1" p={5} overflowY="auto">
        {children}
      </Box>
    </Flex>
  );
};

export default AdminLayout; 