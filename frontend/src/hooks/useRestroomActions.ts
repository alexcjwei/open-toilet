import { useState } from 'react';
import { Restroom, AccessCode, LocationGroup } from '../types';
import { apiService } from '../services/api';

interface UseRestroomActionsOptions {
  onRestroomAdded?: (restroom: Restroom) => void;
  onRestroomUpdated?: (restroom: Restroom) => void;
  onAccessCodeAdded?: (restroomId: number, accessCode: AccessCode) => void;
  onAccessCodeVoted?: (restroomId: number, codeId: number, voteType: 'like' | 'dislike') => void;
}

export const useRestroomActions = ({
  onRestroomAdded,
  onRestroomUpdated,
  onAccessCodeAdded,
  onAccessCodeVoted
}: UseRestroomActionsOptions = {}) => {
  // Form states
  const [showRestroomForm, setShowRestroomForm] = useState(false);
  const [isSubmittingRestroom, setIsSubmittingRestroom] = useState(false);
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false);
  const [selectedRestroom, setSelectedRestroom] = useState<Restroom | null>(null);
  const [isSubmittingAccessCode, setIsSubmittingAccessCode] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingRestroom, setEditingRestroom] = useState<Restroom | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [selectedLocationGroup, setSelectedLocationGroup] = useState<LocationGroup | null>(null);

  // Handle opening restroom form
  const handleAddRestroomClick = () => {
    setShowRestroomForm(true);
  };

  // Handle adding another restroom to existing location
  const handleAddAnotherRestroomClick = (locationGroup: LocationGroup) => {
    setSelectedLocationGroup(locationGroup);
    setShowRestroomForm(true);
  };

  // Handle restroom form submission
  const handleRestroomSubmit = async (restroomData: {
    name: string;
    type: 'male' | 'female' | 'neutral';
    latitude: number;
    longitude: number;
  }) => {
    try {
      setIsSubmittingRestroom(true);
      const newRestroom = await apiService.createRestroom(restroomData);
      onRestroomAdded?.(newRestroom);
      setShowRestroomForm(false);
      setSelectedLocationGroup(null);
    } catch (error) {
      console.error('Failed to create restroom:', error);
      alert('Failed to create restroom. Please try again.');
    } finally {
      setIsSubmittingRestroom(false);
    }
  };

  // Handle form cancellation
  const handleRestroomCancel = () => {
    setShowRestroomForm(false);
    setSelectedLocationGroup(null);
  };

  // Handle opening access code form
  const handleAddAccessCodeClick = (restroom: Restroom) => {
    setSelectedRestroom(restroom);
    setShowAccessCodeForm(true);
  };

  // Handle access code form submission
  const handleAccessCodeSubmit = async (accessCodeData: {
    restroom_id: number;
    code: string;
  }) => {
    try {
      setIsSubmittingAccessCode(true);
      const newAccessCode = await apiService.addAccessCode(accessCodeData.restroom_id, { code: accessCodeData.code });
      onAccessCodeAdded?.(accessCodeData.restroom_id, newAccessCode);
      setShowAccessCodeForm(false);
      setSelectedRestroom(null);
    } catch (error) {
      console.error('Failed to create access code:', error);
      alert('Failed to add access code. Please try again.');
    } finally {
      setIsSubmittingAccessCode(false);
    }
  };

  // Handle access code form cancellation
  const handleAccessCodeCancel = () => {
    setShowAccessCodeForm(false);
    setSelectedRestroom(null);
  };

  // Handle voting on access codes
  const handleVote = async (codeId: number, voteType: 'like' | 'dislike', restroomId: number) => {
    try {
      await apiService.voteOnCode(codeId, { type: voteType });
      onAccessCodeVoted?.(restroomId, codeId, voteType);
    } catch (error) {
      console.error('Failed to vote:', error);
      alert('Failed to vote. Please try again.');
    }
  };

  // Handle opening edit form
  const handleEditRestroomClick = (restroom: Restroom) => {
    setEditingRestroom(restroom);
    setShowEditForm(true);
  };

  // Handle edit form submission
  const handleEditSubmit = async (restroomId: number, data: { name: string }) => {
    try {
      setIsSubmittingEdit(true);
      const updatedRestroom = await apiService.updateRestroom(restroomId, data);
      onRestroomUpdated?.(updatedRestroom);
      setShowEditForm(false);
      setEditingRestroom(null);
    } catch (error) {
      console.error('Failed to update restroom:', error);
      alert('Failed to update restroom. Please try again.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle edit form cancellation
  const handleEditCancel = () => {
    setShowEditForm(false);
    setEditingRestroom(null);
  };

  return {
    // States
    showRestroomForm,
    isSubmittingRestroom,
    showAccessCodeForm,
    selectedRestroom,
    isSubmittingAccessCode,
    showEditForm,
    editingRestroom,
    isSubmittingEdit,
    selectedLocationGroup,

    // Handlers
    handleAddRestroomClick,
    handleAddAnotherRestroomClick,
    handleRestroomSubmit,
    handleRestroomCancel,
    handleAddAccessCodeClick,
    handleAccessCodeSubmit,
    handleAccessCodeCancel,
    handleVote,
    handleEditRestroomClick,
    handleEditSubmit,
    handleEditCancel
  };
};