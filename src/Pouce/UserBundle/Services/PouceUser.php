<?php
namespace Pouce\UserBundle\Services;

use Pouce\UserBundle\Entity\User;

class PouceUser
{
	/**
	* Vérifie si le user a un profil complet
	*
	* @param User $user
	* @return bool
	*/
	public function checkUserAdditionnalInformations(User $user)
	{
		$isUserUpdated =	(null !== $user->getFirstName()) &&
							(null !== $user->getLastName()) &&
							(null !== $user->getSex()) &&
							(null !== $user->getPromotion()) &&
							(null !== $user->getTelephone());

		return $isUserUpdated;
	}
}
