<?php
namespace Pouce\TeamBundle\Services;

class PouceTeam
{
	/**
	* Vérifie si le user est inscrit à la prochaine édition du pouce d'or auquel son école est inscrite
	*
	* @param User $user
	* @return bool
	*/
	public function isRegisterToNextRaceOfItsSchool($user)
	{
		$em = $this->getDoctrine()->getEntityManager();

		try
		{
			$team = $em -> getRepository('PouceTeamBundle:Team')->getLastTeam($user->getId());
		} 
		catch (\Doctrine\ORM\NoResultException $e) 
		{
			return false;
		}

		try
		{
			$nextEditionId = $em -> getRepository('PouceSiteBundle:Edition')->findNextEditionIdBySchool($user->getSchool());
		}
		catch (\Doctrine\ORM\NoResultException $e) 
		{
			return false;
		}

		if($team->getEdition()->getId() == $nextEditionId)
		{
			$answer = true;
		}
		else
		{
			$answer = false;
		}

		return $answer;
	}

	/**
	* Vérifie si le user était inscrit à une course précédente (et pas inscrit dans une prochaine course) ou qui est en train de se dérouler
	*
	* @param User $user
	* @return bool
	*/
	public function isRegisterToPreviousRace($user)
	{
		$em = $this->getDoctrine()->getEntityManager();

		if(isRegisterToNextRaceOfItsSchool($user))
		{
			return false;
		}
		else
		{
			try
			{
				$team = $em -> getRepository('PouceTeamBundle:Team')->getLastTeam($user->getId());
			} 
			catch (\Doctrine\ORM\NoResultException $e) 
			{
				return false;
			}

			$previousEditionId = $em -> getRepository('PouceSiteBundle:Edition')->findPreviousEditionIdBySchool($user->getSchool());

			if($team->getEdition()->getId() == $previousEditionId)
			{
				$answer = true;
			}
			else
			{
				$answer = false;
			}
		}

		return $answer;
	}

	/**
	* Vérifie s'il y a une prochaine course de prévue
	*
	* @param User $user
	* @return bool
	*/
	public function isThereNextRace($user)
	{
		$em = $this->getDoctrine()->getEntityManager();
		try
		{
			$nextEditionId = $em -> getRepository('PouceSiteBundle:Edition')->findNextEditionIdBySchool($user->getSchool());
		}
		catch (\Doctrine\ORM\NoResultException $e) 
		{
			return false;
		}

		if($nextEditionId!=NULL)
		{
			$answer=true;
		}
		else
		{
			$answer=false;
		}

		return $answer;
	}

	/**
	* Vérifie si la team a un result partiel ou non (si une distance est enregistré)
	*
	* @param Team $team
	* @return bool
	*/
	public function isResultSet($team)
	{
		try
		{
			$result = $em -> getRepository('PouceSiteBundle:Edition')->getResult($team);
		}
		catch (\Doctrine\ORM\NoResultException $e) 
		{
			return false;
		}

		if($result->getPosition()==NULL)
		{
			$answer=false;
		}
		else
		{
			$answer=true;
		}
		return $answer;
	}
}