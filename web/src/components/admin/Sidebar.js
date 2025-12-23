import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Flex, 
  Icon,
  Divider,
  Button
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiPackage, 
  FiList, 
  FiLogOut,
  FiTag
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { path: '/admin', label: 'Gösterge Paneli', icon: FiHome },
  { path: '/admin/products', label: 'Ürünler', icon: FiPackage },
  { path: '/admin/categories', label: 'Kategoriler', icon: FiList },
  { path: '/admin/campaigns', label: 'Kampanyalar', icon: FiTag }
];

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <Box
      w="250px"
      h="100vh"
      bg="white"
      boxShadow="md"
      p={4}
      position="sticky"
      top={0}
    >
      <Flex direction="column" h="full">
        <Heading size="md" mb={6} color="blue.600">
          Yan-POS Admin
        </Heading>
        
        <VStack spacing={1} align="stretch" flex="1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link to={item.path} key={item.path}>
                <Flex
                  align="center"
                  py={3}
                  px={4}
                  borderRadius="md"
                  bg={isActive ? 'blue.50' : 'transparent'}
                  color={isActive ? 'blue.600' : 'gray.700'}
                  fontWeight={isActive ? 'bold' : 'normal'}
                  _hover={{ bg: 'gray.100' }}
                  transition="all 0.3s"
                >
                  <Icon as={item.icon} mr={3} boxSize={5} />
                  <Text>{item.label}</Text>
                </Flex>
              </Link>
            );
          })}
        </VStack>
        
        <Divider my={4} />
        
        <Button
          leftIcon={<FiLogOut />}
          variant="ghost"
          justifyContent="flex-start"
          colorScheme="red"
          onClick={logout}
        >
          Çıkış Yap
        </Button>
      </Flex>
    </Box>
  );
};

export default Sidebar; 