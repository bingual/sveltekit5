export const actionMap = (value: ActionType = 'create') => {
  const toastLabelMap = {
    create: '생성',
    update: '수정',
    delete: '삭제',
  };

  const imageLabelMap = {
    create: '등록',
    update: '등록',
  };

  const actionType = value || 'create';
  const toastLabel = toastLabelMap[value] || '';
  const imageLabel = imageLabelMap[value] || '';

  return {
    actionType,
    toastLabel,
    imageLabel,
  };
};
