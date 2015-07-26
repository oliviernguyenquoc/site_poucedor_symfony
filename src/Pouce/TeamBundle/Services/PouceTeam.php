<?php
namespace Pouce\TeamBundle\Services;

use Doctrine\ORM\EntityManager; 

class PouceTeam
{
	protected $em;

	public function __construct(EntityManager $entityManager)
	{
	    $this->em = $entityManager;
	}

	/**
	* Vérifie si le user est inscrit à la prochaine édition du pouce d'or auquel son école est inscrite
	*
	* @param User $user
	* @return bool
	*/
	public function isRegisterToNextRaceOfItsSchool($user)
	{

		try
		{
			$team = $this->em -> getRepository('PouceTeamBundle:Team')->getLastTeam($user->getId());
		} 
		catch (\Doctrine\ORM\NoResultException $e) 
		{
			return false;
		}

		try
		{
			$nextEdition = $this->em -> getRepository('PouceSiteBundle:Edition')->findNextEditionBySchool($user);
		}
		catch (\Doctrine\ORM\NoResultException $e) 
		{
			return false;
		}

		if($team->getEdition()->getId() == $nextEdition->getId())
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
		if(self::isRegisterToNextRaceOfItsSchool($user))
		{
			return false;
		}
		else
		{
			try
			{
				$team = $this->em -> getRepository('PouceTeamBundle:Team')->getLastTeam($user->getId());
			} 
			catch (\Doctrine\ORM\NoResultException $e) 
			{
				return false;
			}

			$previousEdition = $this->em -> getRepository('PouceSiteBundle:Edition')->findPreviousEditionBySchool($user);

			if($team->getEdition()->getId() == $previousEdition->getId())
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
		try
		{
			$nextEdition = $this->em -> getRepository('PouceSiteBundle:Edition')->findNextEditionBySchool($user);
		}
		catch (\Doctrine\ORM\NoResultException $e) 
		{
			return false;
		}
		
		$answer=true;
		
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
			$result = $this->em -> getRepository('PouceTeamBundle:Result')->getResult($team);
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

	/**
	* Vérifie si la team a un result complet ou non (si un récit (ou "comment") est enregistré)
	*
	* @param Team $team
	* @return bool
	*/
	public function isResultSetCompletely($team)
	{
		try
		{
			$result = $this->em -> getRepository('PouceTeamBundle:Result')->getResult($team);
		}
		catch (\Doctrine\ORM\NoResultException $e) 
		{
			return false;
		}

		if($result->getComment()==NULL)
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