import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Demo Role state: 'operator' or 'doctor'
  const [role, setRole] = useState(() => {
    return localStorage.getItem('retinoscan_demo_role') || 'operator';
  });

  const [user, setUser] = useState({
    id: role === 'doctor' ? 'usr-doctor-01' : 'usr-operator-01',
    name: role === 'doctor' ? 'Dr. Sarah Jenkins' : 'Ravi Kumar (Operator)',
    title: role === 'doctor' ? 'Ophthalmologist / Clinician' : 'Screening Center Specialist',
    role,
  });

  useEffect(() => {
    localStorage.setItem('retinoscan_demo_role', role);
    setUser({
      id: role === 'doctor' ? 'usr-doctor-01' : 'usr-operator-01',
      name: role === 'doctor' ? 'Dr. Sarah Jenkins' : 'Ravi Kumar (Operator)',
      title: role === 'doctor' ? 'Ophthalmologist / Clinician' : 'Screening Center Specialist',
      role,
    });
  }, [role]);

  const switchRole = (newRole) => {
    if (newRole === 'operator' || newRole === 'doctor') {
      localStorage.setItem('retinoscan_demo_role', newRole);
      setRole(newRole);
    }
  };

  return (
    <AuthContext.Provider value={{ role, user, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

