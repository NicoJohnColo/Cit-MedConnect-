// ============================================
// USER MANAGEMENT TEST COMPONENT
// src/components/UserManagementTest.jsx
// ============================================

import React, { useState } from 'react';
import { userService } from '../services/userService';
import { Button, Card, Input, Alert } from './common';
import { User, Plus, Edit, Trash2, Search, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const UserManagementTest = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [testUser, setTestUser] = useState({
    schoolId: '20-1234',
    email: 'test.user@cit.edu',
    role: 'student',
    firstName: 'Test',
    lastName: 'User',
    phone: '+639171234567',
    age: 21,
    gender: 'prefer-not-to-say',
    address: 'Test Address',
    dateOfBirth: '2000-01-01'
  });
  const [updateUserId, setUpdateUserId] = useState('');
  const [deleteUserId, setDeleteUserId] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // Helper to show messages
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Test: Create User
  const testCreateUser = async () => {
    setLoading(true);
    try {
      const result = await userService.createUser(testUser);
      if (result.success) {
        showMessage('success', `User created successfully! ID: ${result.data.userId}`);
        // Clear form
        setTestUser({
          ...testUser,
          schoolId: `20-${Math.floor(1000 + Math.random() * 9000)}`,
          email: `test${Date.now()}@cit.edu`
        });
      } else {
        showMessage('error', `Create failed: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Create error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test: Get All Users
  const testGetAllUsers = async () => {
    setLoading(true);
    try {
      const result = await userService.getAllUsers();
      if (result.success) {
        setUsers(result.data);
        showMessage('success', `Fetched ${result.data.length} users`);
      } else {
        showMessage('error', `Fetch failed: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Fetch error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test: Get User by ID
  const testGetUserById = async () => {
    if (!updateUserId) {
      showMessage('error', 'Please enter a User ID');
      return;
    }
    setLoading(true);
    try {
      const result = await userService.getUserById(updateUserId);
      if (result.success) {
        showMessage('success', `User found: ${result.data.firstName} ${result.data.lastName}`);
      } else {
        showMessage('error', `Get by ID failed: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Get by ID error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test: Update User
  const testUpdateUser = async () => {
    if (!updateUserId) {
      showMessage('error', 'Please enter a User ID to update');
      return;
    }
    setLoading(true);
    try {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+639171234999'
      };
      const result = await userService.updateUser(updateUserId, updateData);
      if (result.success) {
        showMessage('success', `User updated successfully!`);
      } else {
        showMessage('error', `Update failed: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Update error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test: Delete User
  const testDeleteUser = async () => {
    if (!deleteUserId) {
      showMessage('error', 'Please enter a User ID to delete');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    setLoading(true);
    try {
      const result = await userService.deleteUser(deleteUserId);
      if (result.success) {
        showMessage('success', `User deleted successfully!`);
        setDeleteUserId('');
      } else {
        showMessage('error', `Delete failed: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Delete error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test: Check Email Exists
  const testCheckEmailExists = async () => {
    if (!searchEmail) {
      showMessage('error', 'Please enter an email to check');
      return;
    }
    setLoading(true);
    try {
      const result = await userService.checkEmailExists(searchEmail);
      if (result.success) {
        showMessage('success', `Email ${searchEmail} ${result.data ? 'EXISTS' : 'DOES NOT EXIST'}`);
      } else {
        showMessage('error', `Email check failed: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Email check error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test: Get User by Email
  const testGetUserByEmail = async () => {
    if (!searchEmail) {
      showMessage('error', 'Please enter an email to search');
      return;
    }
    setLoading(true);
    try {
      const result = await userService.getUserByEmail(searchEmail);
      if (result.success) {
        showMessage('success', `User found: ${result.data.firstName} ${result.data.lastName}`);
      } else {
        showMessage('error', `Get by email failed: ${result.error}`);
      }
    } catch (error) {
      showMessage('error', `Get by email error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-management-test">
      <div className="page-header">
        <div>
          <h1 className="page-title">Backend Integration Test</h1>
          <p className="page-subtitle">Test all user CRUD operations with Spring Boot backend</p>
        </div>
      </div>

      {/* Alert Messages */}
      {message.text && (
        <Alert 
          type={message.type}
          icon={message.type === 'success' ? CheckCircle : AlertCircle}
          onClose={() => setMessage({ type: '', text: '' })}
        >
          {message.text}
        </Alert>
      )}

      <div className="test-grid">
        {/* Create User Test */}
        <Card className="test-card">
          <h3><Plus size={20} /> Create User</h3>
          <div className="test-form">
            <Input
              label="School ID"
              value={testUser.schoolId}
              onChange={(e) => setTestUser({...testUser, schoolId: e.target.value})}
              placeholder="20-1234"
            />
            <Input
              label="Email"
              value={testUser.email}
              onChange={(e) => setTestUser({...testUser, email: e.target.value})}
              placeholder="test.user@cit.edu"
            />
            <Input
              label="First Name"
              value={testUser.firstName}
              onChange={(e) => setTestUser({...testUser, firstName: e.target.value})}
              placeholder="First Name"
            />
            <Input
              label="Last Name"
              value={testUser.lastName}
              onChange={(e) => setTestUser({...testUser, lastName: e.target.value})}
              placeholder="Last Name"
            />
            <Button
              variant="primary"
              onClick={testCreateUser}
              loading={loading}
              disabled={loading}
              icon={Plus}
            >
              Create User
            </Button>
          </div>
        </Card>

        {/* Read Operations Test */}
        <Card className="test-card">
          <h3><Search size={20} /> Read Operations</h3>
          <div className="test-form">
            <Button
              variant="primary"
              onClick={testGetAllUsers}
              loading={loading}
              disabled={loading}
              icon={User}
            >
              Get All Users
            </Button>
            
            <Input
              label="User ID"
              value={updateUserId}
              onChange={(e) => setUpdateUserId(e.target.value)}
              placeholder="Enter User ID"
            />
            <div className="button-group">
              <Button
                variant="secondary"
                onClick={testGetUserById}
                loading={loading}
                disabled={loading}
                icon={Search}
              >
                Get by ID
              </Button>
              <Button
                variant="secondary"
                onClick={testUpdateUser}
                loading={loading}
                disabled={loading}
                icon={Edit}
              >
                Update User
              </Button>
            </div>

            <Input
              label="Email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="test.user@cit.edu"
              icon={Mail}
            />
            <div className="button-group">
              <Button
                variant="secondary"
                onClick={testCheckEmailExists}
                loading={loading}
                disabled={loading}
                icon={Search}
              >
                Check Email
              </Button>
              <Button
                variant="secondary"
                onClick={testGetUserByEmail}
                loading={loading}
                disabled={loading}
                icon={User}
              >
                Get by Email
              </Button>
            </div>
          </div>
        </Card>

        {/* Delete User Test */}
        <Card className="test-card">
          <h3><Trash2 size={20} /> Delete User</h3>
          <div className="test-form">
            <Input
              label="User ID to Delete"
              value={deleteUserId}
              onChange={(e) => setDeleteUserId(e.target.value)}
              placeholder="Enter User ID"
            />
            <Button
              variant="danger"
              onClick={testDeleteUser}
              loading={loading}
              disabled={loading}
              icon={Trash2}
            >
              Delete User
            </Button>
          </div>
        </Card>

        {/* Users List */}
        {users.length > 0 && (
          <Card className="test-card users-list">
            <h3><User size={20} /> Users ({users.length})</h3>
            <div className="users-grid">
              {users.map((user) => (
                <div key={user.userId} className="user-item">
                  <div className="user-avatar">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="user-info">
                    <p><strong>{user.firstName} {user.lastName}</strong></p>
                    <p>{user.email}</p>
                    <p>ID: {user.userId}</p>
                    <span className={`user-role ${user.role}`}>{user.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <style jsx>{`
        .user-management-test {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .test-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .test-card {
          padding: 1.5rem;
        }

        .test-card h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #333;
        }

        .test-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .button-group {
          display: flex;
          gap: 0.5rem;
        }

        .users-list {
          grid-column: 1 / -1;
        }

        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .user-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #2196F3;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .user-info {
          flex: 1;
        }

        .user-info p {
          margin: 0.25rem 0;
          font-size: 0.9rem;
        }

        .user-role {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
        }

        .user-role.student {
          background: #E3F2FD;
          color: #1976D2;
        }

        .user-role.staff {
          background: #E8F5E8;
          color: #388E3C;
        }

        .user-role.admin {
          background: #FFF3E0;
          color: #F57C00;
        }
      `}</style>
    </div>
  );
};

export default UserManagementTest;
