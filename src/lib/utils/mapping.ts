export const actionMap = (value: ActionType = 'create') => {
  const toastMessageMap = {
    create: '생성',
    update: '수정',
    delete: '삭제',
  };

  const actionType = value || 'create';
  const toastMessage = toastMessageMap[value] || '';

  return {
    actionType,
    toastMessage,
  };
};
