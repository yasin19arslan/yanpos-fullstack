import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  Heading,
  Text,
  Flex,
  Icon,
  Spinner,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge
} from '@chakra-ui/react';
import { FiUsers, FiShoppingBag, FiCreditCard, FiBarChart2 } from 'react-icons/fi';
import { useApi } from '../../hooks/useApi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    orders: 0,
    products: 0,
    users: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardData = await api.get('/api/admin/dashboard');
        setStats(dashboardData.stats);
        setRecentOrders(dashboardData.recentOrders || []);
      } catch (error) {
        console.error('Dashboard verileri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [api]);

  if (loading) {
    return (
      <Flex justify="center" align="center" height="60vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={6}>Gösterge Paneli</Heading>
      
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6} mb={8}>
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Stat>
                <StatLabel>Toplam Sipariş</StatLabel>
                <StatNumber>{stats.orders}</StatNumber>
                <StatHelpText>Bu ay</StatHelpText>
              </Stat>
              <Box p={3} bg="blue.50" borderRadius="full">
                <Icon as={FiShoppingBag} boxSize={6} color="blue.500" />
              </Box>
            </Flex>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Stat>
                <StatLabel>Toplam Ürün</StatLabel>
                <StatNumber>{stats.products}</StatNumber>
                <StatHelpText>Aktif ürünler</StatHelpText>
              </Stat>
              <Box p={3} bg="green.50" borderRadius="full">
                <Icon as={FiBarChart2} boxSize={6} color="green.500" />
              </Box>
            </Flex>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Stat>
                <StatLabel>Kullanıcılar</StatLabel>
                <StatNumber>{stats.users}</StatNumber>
                <StatHelpText>Toplam kullanıcı</StatHelpText>
              </Stat>
              <Box p={3} bg="purple.50" borderRadius="full">
                <Icon as={FiUsers} boxSize={6} color="purple.500" />
              </Box>
            </Flex>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Stat>
                <StatLabel>Gelir</StatLabel>
                <StatNumber>{stats.revenue} ₺</StatNumber>
                <StatHelpText>Bu ay</StatHelpText>
              </Stat>
              <Box p={3} bg="orange.50" borderRadius="full">
                <Icon as={FiCreditCard} boxSize={6} color="orange.500" />
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </Grid>
      
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>Son Siparişler</Heading>
          <Divider mb={4} />
          
          {recentOrders.length === 0 ? (
            <Text textAlign="center" py={4}>Henüz sipariş bulunmuyor</Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Sipariş No</Th>
                  <Th>Müşteri</Th>
                  <Th>Tarih</Th>
                  <Th>Tutar</Th>
                  <Th>Durum</Th>
                </Tr>
              </Thead>
              <Tbody>
                {recentOrders.map((order) => (
                  <Tr key={order._id}>
                    <Td>#{order._id.substring(order._id.length - 6)}</Td>
                    <Td>{order.customerName}</Td>
                    <Td>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</Td>
                    <Td>{order.totalAmount.toFixed(2)} ₺</Td>
                    <Td>
                      <Badge
                        colorScheme={
                          order.status === 'completed' ? 'green' :
                          order.status === 'processing' ? 'blue' :
                          order.status === 'cancelled' ? 'red' : 'yellow'
                        }
                      >
                        {order.status === 'completed' ? 'Tamamlandı' :
                         order.status === 'processing' ? 'İşlemde' :
                         order.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default AdminDashboard; 